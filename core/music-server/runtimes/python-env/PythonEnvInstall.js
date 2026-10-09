const fs = require('fs');
const crypto = require('crypto');
const Wsl = require('../Wsl');
const WslFormat = require('../WslFormat');
const PythonEnvLayout = require('./PythonEnvLayout');
const PythonEnvShell = require('./PythonEnvShell');
const PythonPackageSpec = require('./PythonPackageSpec');
const ResumableDownload = require('../../../shared/download/ResumableDownload');
const RuntimeManifest = require('../../../shared/runtime/RuntimeManifest');
const RuntimeInstallError = require('../../../shared/runtime/install/RuntimeInstallError');

class PythonEnvInstall {
  static VENV_TIMEOUT_MS = 10 * 60 * 1000;
  static PIP_TIMEOUT_MS = 60 * 60 * 1000;
  static STAGE_TIMEOUT_MS = 120000;
  static FREEZE_TIMEOUT_MS = 60000;
  static CHECK_TIMEOUT_MS = 10000;
  static FREEZE_SHA_LENGTH = 16;

  constructor(entry, { runtimesRoot, onEvent, isCanceled }) {
    this._entry = entry;
    this._pkg = entry.pythonPackage;
    this._runtimesRoot = runtimesRoot;
    this._onEvent = onEvent;
    this._isCanceled = isCanceled;
    this._distro = null;
    this._layout = null;
  }

  async execute() {
    await this._resolveHost();
    this._emit('resolved', PythonPackageSpec.resolvedEvent(this._pkg));
    await this._ensureHostDirs();
    await this._downloadUv();
    await this._stageUv();
    await this._createVenv();
    await this._installPackage();
    await this._verifyBinaries();
    const manifest = await this._writeManifest(await this._freezeSha());
    fs.promises.unlink(this._layout.uvTarball).catch(() => {});
    this._emit('finalize', { binaryPath: this._layout.binPath, manifest });
    return { success: true, binaryPath: this._layout.binPath, manifest };
  }

  async _resolveHost() {
    if (process.platform !== 'win32') {
      this._layout = new PythonEnvLayout({ mode: 'native', runtimesRoot: this._runtimesRoot, id: this._entry.id });
      return;
    }
    const wsl = await Wsl.detect();
    PythonEnvInstall._assertWslReady(wsl);
    this._distro = wsl.distro;
    const wslRoot = PythonEnvLayout.wslRootFor(await this._wslHome());
    this._layout = new PythonEnvLayout({ mode: 'wsl', runtimesRoot: this._runtimesRoot, id: this._entry.id, wslRoot });
  }

  static _assertWslReady(wsl) {
    if (!wsl.wsl2) {
      throw new RuntimeInstallError(wsl.note || 'WSL2 is required to install SGLang-Omni on Windows.', 'WSL_NOT_READY', { wsl });
    }
    if (!wsl.nvidiaDriverOk) {
      throw new RuntimeInstallError(wsl.note || 'The WSL distro cannot see the GPU. Install the NVIDIA driver with WSL support.', 'WSL_NO_GPU', { wsl });
    }
  }

  async _wslHome() {
    const home = await Wsl.runInWsl(this._distro, 'echo "$HOME"');
    const homeDir = (home.stdout || '').trim();
    if (!home.ok || !homeDir.startsWith('/')) {
      throw new RuntimeInstallError(`Could not resolve $HOME in WSL distro ${this._distro}.`, 'WSL_HOME_UNRESOLVED');
    }
    return homeDir;
  }

  async _ensureHostDirs() {
    await fs.promises.mkdir(this._layout.managedDir, { recursive: true });
    await fs.promises.mkdir(this._layout.toolsDir, { recursive: true });
  }

  async _downloadUv() {
    const result = await ResumableDownload.download({
      url: PythonEnvLayout.uvDownloadUrl(),
      destPath: this._layout.uvTarball,
      controller: new AbortController(),
      isCanceled: () => this._canceled(),
      label: 'uv',
      onProgress: (received, total) => this._emit('download', { received, total }),
    });
    if (result && result.canceled) throw PythonEnvInstall._canceledError();
  }

  async _stageUv() {
    this._emit('extract', { phase: 'start', label: 'Setting up Python 3.12 environment…' });
    const staged = this._layout.isWsl ? await this._stageUvInWsl() : await this._stageUvNatively();
    if (!staged.ok) throw new RuntimeInstallError(staged.message, 'UV_SETUP_FAILED');
    if (this._canceled()) throw PythonEnvInstall._canceledError();
  }

  async _stageUvInWsl() {
    const q = WslFormat.shellQuote;
    const { wslToolsDir, wslRuntimeDir, uvPath } = this._layout;
    const cmd = `mkdir -p ${q(wslToolsDir)} ${q(wslRuntimeDir)} && `
      + `tar -xzf ${q(WslFormat.toWslPath(this._layout.uvTarball))} -C ${q(wslToolsDir)} --strip-components=1 && `
      + `chmod +x ${q(uvPath)} && ${q(uvPath)} --version`;
    const result = await Wsl.runInWsl(this._distro, cmd, { timeout: PythonEnvInstall.STAGE_TIMEOUT_MS });
    return { ok: result.ok, message: `Could not stage uv inside WSL: ${result.reason || result.stderr}` };
  }

  async _stageUvNatively() {
    const { uvTarball, toolsDir } = this._layout;
    const result = await PythonEnvShell.exec('tar', ['-xzf', uvTarball, '-C', toolsDir, '--strip-components=1'], PythonEnvInstall.STAGE_TIMEOUT_MS);
    return { ok: result.ok, message: `Could not extract uv: ${result.reason}` };
  }

  async _createVenv() {
    const q = WslFormat.shellQuote;
    const { venvPath, uvPath } = this._layout;
    const cmd = `rm -rf ${q(venvPath)} && ${q(uvPath)} venv --python ${this._pkg.python} ${q(venvPath)}`;
    const result = await this._streamStep(cmd, PythonEnvInstall.VENV_TIMEOUT_MS);
    if (!result.ok) throw new RuntimeInstallError(`uv venv failed: ${result.tail}`, 'VENV_FAILED');
  }

  async _installPackage() {
    const q = WslFormat.shellQuote;
    const extras = PythonPackageSpec.extras(this._pkg).map((p) => q(p)).join(' ');
    const cmd = `${q(this._layout.uvPath)} pip install --python ${q(this._layout.pythonPath)} ${q(PythonPackageSpec.requirement(this._pkg))}${extras ? ` ${extras}` : ''}`;
    const result = await this._streamStep(cmd, PythonEnvInstall.PIP_TIMEOUT_MS);
    if (!result.ok) throw new RuntimeInstallError(`uv pip install ${PythonPackageSpec.label(this._pkg)} failed: ${result.tail}`, 'PIP_INSTALL_FAILED');
    this._emit('extract', { phase: 'done' });
  }

  async _streamStep(cmd, timeout) {
    const result = await PythonEnvShell.stream({
      mode: this._layout.mode,
      distro: this._distro,
      cmd,
      timeout,
      canceled: () => this._canceled(),
      onLine: (line) => this._emit('extract', { phase: 'progress', label: line }),
    });
    if (result.canceled) throw PythonEnvInstall._canceledError();
    return result;
  }

  async _verifyBinaries() {
    const mustExist = [this._layout.binPath];
    if (PythonPackageSpec.extras(this._pkg).includes('ninja')) mustExist.push(this._layout.venvBin('ninja'));
    for (const binary of mustExist) {
      if (!(await this._isExecutable(binary))) {
        throw new RuntimeInstallError(`Install completed but ${binary} is missing or not executable.`, 'BINARY_NOT_FOUND_AFTER_INSTALL');
      }
    }
  }

  async _isExecutable(binary) {
    const check = this._layout.isWsl
      ? await Wsl.runInWsl(this._distro, `test -x ${WslFormat.shellQuote(binary)}`)
      : await PythonEnvShell.exec('test', ['-x', binary], PythonEnvInstall.CHECK_TIMEOUT_MS);
    return !!check.ok;
  }

  async _freezeSha() {
    const q = WslFormat.shellQuote;
    try {
      const freeze = await PythonEnvShell.stream({
        mode: this._layout.mode,
        distro: this._distro,
        cmd: `${q(this._layout.uvPath)} pip freeze --python ${q(this._layout.pythonPath)}`,
        timeout: PythonEnvInstall.FREEZE_TIMEOUT_MS,
        canceled: () => false,
        onLine: null,
      });
      if (!freeze.ok) return null;
      return crypto.createHash('sha1').update(freeze.out).digest('hex').slice(0, PythonEnvInstall.FREEZE_SHA_LENGTH);
    } catch (_) {
      return null;
    }
  }

  async _writeManifest(freezeSha) {
    const { mode, venvPath, binPath, uvPath } = this._layout;
    const src = this._pkg.sourceArchive || null;
    const manifest = {
      id: this._entry.id,
      mode,
      distro: this._distro,
      venvPath,
      binPath,
      uvPath,
      package: {
        name: this._pkg.name,
        version: this._pkg.version,
        sourceRef: src ? src.ref : null,
        envRevision: this._pkg.envRevision || 1,
        extraPackages: PythonPackageSpec.extras(this._pkg),
      },
      python: this._pkg.python,
      freezeSha,
      installedAt: new Date().toISOString(),
    };
    await RuntimeManifest.write(this._layout.managedDir, manifest);
    return manifest;
  }

  _emit(type, payload) {
    try {
      if (typeof this._onEvent === 'function') this._onEvent(type, payload || {});
    } catch (_) {}
  }

  _canceled() {
    try {
      return typeof this._isCanceled === 'function' && !!this._isCanceled();
    } catch (_) {
      return false;
    }
  }

  static _canceledError() {
    return new RuntimeInstallError('Install canceled.', 'CANCELED');
  }
}

module.exports = PythonEnvInstall;
