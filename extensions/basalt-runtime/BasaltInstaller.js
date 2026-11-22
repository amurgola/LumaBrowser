const path = require('path');
const BasaltCard = require('./BasaltCard');
const BasaltCatalog = require('./BasaltCatalog');
const BasaltCudaCompanion = require('./BasaltCudaCompanion');
const BasaltCudaRuntime = require('./BasaltCudaRuntime');
const BasaltLayout = require('./BasaltLayout');
const BasaltPythonFinder = require('./BasaltPythonFinder');
const BasaltReleaseArchive = require('./BasaltReleaseArchive');
const BasaltVenv = require('./BasaltVenv');
const CoreRequire = require('./CoreRequire');

const CudaProbe = CoreRequire.load('llm-server/diagnostics/CudaProbe');
const NvidiaSmi = CoreRequire.load('shared/runtime/NvidiaSmi');
const InstallEvents = CoreRequire.load('shared/runtime/install/InstallEvents');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');
const RuntimeManifest = CoreRequire.load('shared/runtime/RuntimeManifest');

class BasaltInstaller {
  constructor({ entry, runtimesRoot, managedDir, onEvent, isCanceled }, parts = {}) {
    this._build = BasaltCatalog.buildFor(entry && entry.id);
    if (!this._build) throw new RuntimeInstallError(`${(entry && entry.id) || 'This row'} is not a Basalt build.`, 'UNKNOWN_BUILD');
    this._job = {
      entry,
      build: this._build,
      runtimesRoot,
      managedDir,
      emit: InstallEvents.emitter(onEvent),
      canceled: () => (typeof isCanceled === 'function' ? !!isCanceled() : false),
    };
    this._parts = { ...BasaltInstaller._defaultParts(), ...parts };
  }

  static install(options) {
    return new BasaltInstaller(options).execute();
  }

  async execute() {
    const card = await this._requireBlackwellCard();
    const python = await this._parts.findPython();
    const { binaryPath, asset } = await this._unpackRelease();
    const layout = new BasaltLayout(binaryPath);
    const cudaRuntime = await this._installCudaRuntime(layout);
    await this._buildVenv(layout, python);
    return this._finalize({ layout, asset, card, python, cudaRuntime });
  }

  static _defaultParts() {
    return {
      probeCuda: () => CudaProbe.probe({ savedNvidiaSmiPath: NvidiaSmi.hasExplicitPath() ? NvidiaSmi.smiPath() : null }),
      findPython: () => new BasaltPythonFinder().find(),
      archive: (job) => new BasaltReleaseArchive(job).install(),
      cudaRuntime: (options) => new BasaltCudaRuntime(options).install(),
      venv: (options) => new BasaltVenv(options).create(),
    };
  }

  async _requireBlackwellCard() {
    const cuda = await this._parts.probeCuda();
    const card = BasaltCard.pick(cuda && cuda.available ? cuda.devices : []);
    if (card) return card;
    throw new RuntimeInstallError(BasaltCard.NO_CARD_REASON, 'NO_BLACKWELL_GPU', { devices: (cuda && cuda.devices) || [] });
  }

  _unpackRelease() {
    this._throwIfCanceled();
    return this._parts.archive(this._job);
  }

  _installCudaRuntime(layout) {
    this._throwIfCanceled();
    const { entry, runtimesRoot, managedDir, emit } = this._job;
    const companion = new BasaltCudaCompanion({ entry, runtimesRoot, emit });
    return this._parts.cudaRuntime({ runtimesRoot, managedDir, binDir: layout.binDir, emit, fetchCompanion: (dir) => companion.fetchInto(dir) });
  }

  async _buildVenv(layout, python) {
    this._throwIfCanceled();
    await this._parts.venv({ layout, python, emit: this._job.emit, canceled: this._job.canceled });
    this._job.emit('extract', { phase: 'done' });
  }

  async _finalize({ layout, asset, card, python, cudaRuntime }) {
    const { managedDir, emit } = this._job;
    const manifest = {
      id: this._build.runtimeId,
      installedAt: new Date().toISOString(),
      release: { tag: this._build.release.tag, url: BasaltCatalog.releaseUrl(this._build), channel: 'stable', prerelease: false },
      asset: { name: asset.name, url: asset.url, size: asset.bytes, sha256: asset.sha256 },
      binary: path.relative(managedDir, layout.binaryPath),
      python: { command: python.command, args: python.args, version: python.version },
      cudaRuntime,
      gpu: card,
    };
    await RuntimeManifest.write(managedDir, manifest);
    emit('finalize', { binaryPath: layout.binaryPath, manifest });
    return { success: true, binaryPath: layout.binaryPath, manifest };
  }

  _throwIfCanceled() {
    if (this._job.canceled()) throw new RuntimeInstallError('Install canceled.', 'CANCELED');
  }
}

module.exports = BasaltInstaller;
