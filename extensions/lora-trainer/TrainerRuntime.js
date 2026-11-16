const fs = require('fs');
const ArchiveExtractor = require('../../core/shared/runtime/install/ArchiveExtractor');
const BinaryLookup = require('../../core/shared/runtime/BinaryLookup');
const NvidiaSmi = require('../../core/shared/runtime/NvidiaSmi');
const ResumableDownload = require('../../core/shared/download/ResumableDownload');
const TrainerRuntimeInstall = require('./TrainerRuntimeInstall');
const TrainerRuntimeSpec = require('./TrainerRuntimeSpec');

class TrainerRuntime {
  static ENTRY_SCRIPT = 'run.py';

  constructor({ paths, environment, runner, installFactory = null, fsOps = fs }) {
    this._paths = paths;
    this._environment = environment;
    this._runner = runner;
    this._fs = fsOps;
    this._installFactory = installFactory || ((options) => new TrainerRuntimeInstall(options));
    this._installing = null;
  }

  status() {
    const manifest = this._readManifest();
    return { installed: this._isCurrent(manifest), manifest };
  }

  async ensureInstalled({ onStep, isCanceled } = {}) {
    const { installed, manifest } = this.status();
    if (installed) return manifest;
    if (!this._installing) {
      this._installing = this._install({ onStep, isCanceled }).finally(() => { this._installing = null; });
    }
    return this._installing;
  }

  trainCommand({ configPath, logPath, cudaDevice }) {
    const { manifest } = this.status();
    if (!manifest) throw new Error('The trainer runtime is not installed.');
    return {
      command: manifest.pythonPath,
      args: [TrainerRuntime.ENTRY_SCRIPT, configPath, '--log', logPath],
      cwd: manifest.sourceDir,
      env: this._environment.forTraining(cudaDevice),
    };
  }

  _install({ onStep, isCanceled }) {
    return this._installFactory({
      paths: this._paths,
      environment: this._environment,
      runner: this._runner,
      download: (options) => ResumableDownload.download(options),
      extract: (archive, dir) => ArchiveExtractor.extract(archive, dir),
      findBinary: (dir, names) => BinaryLookup.findBinaryIn(dir, names),
      smiBanner: () => TrainerRuntime.smiBanner(),
      onStep,
      isCanceled,
    }).execute();
  }

  _readManifest() {
    try {
      return JSON.parse(this._fs.readFileSync(this._paths.manifestPath, 'utf8'));
    } catch (_) {
      return null;
    }
  }

  _isCurrent(manifest) {
    if (!manifest) return false;
    const wanted = TrainerRuntimeSpec.fingerprint();
    const matches = Object.keys(wanted).every((key) => manifest[key] === wanted[key]);
    return matches && this._fs.existsSync(manifest.pythonPath) && this._fs.existsSync(manifest.sourceDir);
  }

  static async smiBanner() {
    const result = await NvidiaSmi.query([]);
    return result && result.ok ? result.stdout : '';
  }
}

module.exports = TrainerRuntime;
