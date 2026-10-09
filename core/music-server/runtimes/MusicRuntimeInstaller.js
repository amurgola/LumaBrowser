const RuntimeInstaller = require('../../shared/runtime/RuntimeInstaller');
const RuntimeManifest = require('../../shared/runtime/RuntimeManifest');
const AcquisitionGuard = require('../../shared/runtime/install/AcquisitionGuard');
const ManagedDir = require('../../shared/runtime/install/ManagedDir');
const MusicRuntimeCatalog = require('./MusicRuntimeCatalog');
const Wsl = require('./Wsl');
const WslFormat = require('./WslFormat');
const PythonEnvInstall = require('./python-env/PythonEnvInstall');

class MusicRuntimeInstaller extends RuntimeInstaller {
  static WSL_REMOVE_TIMEOUT_MS = 120000;

  constructor({ catalog = new MusicRuntimeCatalog(), ...seams } = {}) {
    super({ catalog, userAgent: 'LumaBrowser-MusicServer', expectedKind: 'music-inference', kindNoun: 'music inference', ...seams });
  }

  async installRuntime(id, { runtimesRoot, onEvent, isCanceled } = {}) {
    const entry = AcquisitionGuard.entryFor(this._catalog, id);
    this._assertPythonEnv(entry);
    return new PythonEnvInstall(entry, { runtimesRoot, onEvent, isCanceled }).execute();
  }

  async uninstallRuntime(id, { runtimesRoot } = {}) {
    const entry = AcquisitionGuard.entryFor(this._catalog, id);
    const managedDir = ManagedDir.pathFor(runtimesRoot, entry.id);
    await MusicRuntimeInstaller._removeWslVenv(await RuntimeManifest.read(managedDir));
    return super.uninstallRuntime(id, { runtimesRoot });
  }

  _assertPythonEnv(entry) {
    if (entry.kind !== this.expectedKind) throw new Error(`Runtime ${entry.id} is not a music inference runtime.`);
    if (entry.acquisition !== 'python-env') throw new Error(`Runtime ${entry.id} is not python-env managed.`);
  }

  static async _removeWslVenv(manifest) {
    if (!manifest || manifest.mode !== 'wsl' || !manifest.venvPath) return;
    await Wsl.runInWsl(manifest.distro, `rm -rf ${WslFormat.shellQuote(manifest.venvPath)}`, { timeout: MusicRuntimeInstaller.WSL_REMOVE_TIMEOUT_MS });
  }
}

module.exports = MusicRuntimeInstaller;
