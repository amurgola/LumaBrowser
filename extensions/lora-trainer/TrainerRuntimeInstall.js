const fs = require('fs');
const path = require('path');
const TrainerRequirements = require('./TrainerRequirements');
const TrainerRuntimeSpec = require('./TrainerRuntimeSpec');

class TrainerRuntimeInstall {
  static VENV_TIMEOUT_MS = 15 * 60 * 1000;
  static TORCH_TIMEOUT_MS = 60 * 60 * 1000;
  static REQUIREMENTS_TIMEOUT_MS = 90 * 60 * 1000;
  static CANCELED = 'CANCELED';
  static ENTRY_SCRIPT = 'run.py';

  constructor({ paths, environment, runner, download, extract, findBinary, smiBanner, onStep = () => {}, isCanceled = () => false, fsOps = fs }) {
    this._paths = paths;
    this._environment = environment;
    this._runner = runner;
    this._download = download;
    this._extract = extract;
    this._findBinary = findBinary;
    this._smiBanner = smiBanner;
    this._onStep = onStep;
    this._isCanceled = isCanceled;
    this._fs = fsOps;
  }

  async execute() {
    this._prepareFolders();
    const uvPath = await this._installUv();
    const sourceDir = await this._installSource();
    await this._createVenv(uvPath);
    const backend = await this._pickBackend();
    await this._installTorch(uvPath, backend);
    await this._installRequirements(uvPath, sourceDir, backend);
    this._discard(this._paths.uvCacheDir);
    return this._writeManifest({ uvPath, sourceDir, backend });
  }

  _prepareFolders() {
    for (const dir of [this._paths.runtimeDir, this._paths.uvDir, this._paths.sourceRoot]) this._fs.mkdirSync(dir, { recursive: true });
  }

  async _installUv() {
    this._step('Downloading the uv Python manager');
    const asset = TrainerRuntimeSpec.uvAsset();
    const archive = path.join(this._paths.runtimeDir, asset.file);
    await this._fetch(asset.url, archive, 'uv');
    await this._extract(archive, this._paths.uvDir);
    this._discard(archive);
    const uvPath = await this._findBinary(this._paths.uvDir, this._paths.uvBinaryNames);
    if (!uvPath) throw new Error('uv was downloaded but its program was not found in the archive.');
    return uvPath;
  }

  async _installSource() {
    this._step('Downloading the ai-toolkit trainer');
    const ref = TrainerRuntimeSpec.SOURCE_REF;
    const archive = path.join(this._paths.runtimeDir, `ai-toolkit-${ref}.zip`);
    await this._fetch(TrainerRuntimeSpec.sourceArchiveUrl(ref), archive, 'ai-toolkit');
    await this._extract(archive, this._paths.sourceRoot);
    this._discard(archive);
    const sourceDir = this._paths.sourceDir(ref);
    if (!this._fs.existsSync(path.join(sourceDir, TrainerRuntimeInstall.ENTRY_SCRIPT))) {
      throw new Error(`The ai-toolkit archive did not unpack to ${sourceDir}.`);
    }
    return sourceDir;
  }

  async _createVenv(uvPath) {
    this._step(`Creating a Python ${TrainerRuntimeSpec.PYTHON} environment`);
    this._fs.rmSync(this._paths.venvDir, { recursive: true, force: true });
    const args = ['venv', this._paths.venvDir, '--python', TrainerRuntimeSpec.PYTHON, '--managed-python', '--seed'];
    await this._uv(uvPath, args, TrainerRuntimeInstall.VENV_TIMEOUT_MS, 'Creating the Python environment failed');
  }

  async _pickBackend() {
    const banner = await this._smiBanner();
    return TrainerRuntimeSpec.torchBackend(TrainerRuntimeSpec.driverCudaVersion(banner));
  }

  async _installTorch(uvPath, backend) {
    this._step(`Installing PyTorch ${TrainerRuntimeSpec.TORCH.torch} (${backend}), several GB`);
    const args = [...this._pipInstall(), ...TrainerRuntimeSpec.torchRequirements(), '--index-url', TrainerRuntimeSpec.torchIndexUrl(backend)];
    await this._uv(uvPath, args, TrainerRuntimeInstall.TORCH_TIMEOUT_MS, 'Installing PyTorch failed');
  }

  async _installRequirements(uvPath, sourceDir, backend) {
    this._step('Installing the trainer\'s Python packages');
    const lines = TrainerRequirements.resolve(path.join(sourceDir, 'requirements.txt'), (file) => this._fs.readFileSync(file, 'utf8'));
    this._fs.writeFileSync(this._paths.requirementsPath, lines.join('\n') + '\n');
    this._fs.writeFileSync(this._paths.constraintsPath, TrainerRuntimeSpec.torchConstraints(backend).join('\n') + '\n');
    const args = [...this._pipInstall(), '-r', this._paths.requirementsPath, '--constraint', this._paths.constraintsPath];
    await this._uv(uvPath, args, TrainerRuntimeInstall.REQUIREMENTS_TIMEOUT_MS, 'Installing the trainer packages failed');
  }

  _writeManifest({ uvPath, sourceDir, backend }) {
    const manifest = { ...TrainerRuntimeSpec.fingerprint(), backend, uvPath, sourceDir, pythonPath: this._paths.pythonPath, installedAt: new Date().toISOString() };
    this._fs.writeFileSync(this._paths.manifestPath, JSON.stringify(manifest, null, 2));
    this._step('Trainer ready');
    return manifest;
  }

  _pipInstall() {
    return ['pip', 'install', '--python', this._paths.pythonPath];
  }

  async _uv(uvPath, args, timeoutMs, failure) {
    const result = await this._runner.run({
      command: uvPath,
      args,
      cwd: this._paths.runtimeDir,
      env: this._environment.forInstall(),
      timeoutMs,
      isCanceled: this._isCanceled,
      onLine: (line) => this._onStep(null, line),
    });
    if (result.canceled) throw TrainerRuntimeInstall._canceled();
    if (result.timedOut) throw new Error(`${failure}: it ran out of time.`);
    if (!result.ok) throw new Error(`${failure}: ${result.tail || `exit code ${result.code}`}`);
  }

  async _fetch(url, destPath, label) {
    this._discard(destPath);
    const result = await this._download({
      url,
      destPath,
      controller: new AbortController(),
      isCanceled: this._isCanceled,
      label,
      onProgress: (received, total) => this._onStep(null, TrainerRuntimeInstall._bytes(label, received, total)),
    });
    if (result && result.canceled) throw TrainerRuntimeInstall._canceled();
  }

  _discard(target) {
    try { this._fs.rmSync(target, { recursive: true, force: true }); } catch (_) {}
  }

  _step(label) {
    if (this._isCanceled()) throw TrainerRuntimeInstall._canceled();
    this._onStep(label, null);
  }

  static _bytes(label, received, total) {
    const megabytes = (n) => `${Math.round((Number(n) || 0) / (1024 * 1024))} MB`;
    return total ? `${label}: ${megabytes(received)} of ${megabytes(total)}` : `${label}: ${megabytes(received)}`;
  }

  static _canceled() {
    const err = new Error('The trainer install was canceled.');
    err.code = TrainerRuntimeInstall.CANCELED;
    return err;
  }
}

module.exports = TrainerRuntimeInstall;
