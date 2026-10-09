const fs = require('fs');
const path = require('path');
const MusicRuntimeCatalog = require('./MusicRuntimeCatalog');
const Wsl = require('./Wsl');
const WslFormat = require('./WslFormat');
const RuntimeManifest = require('../../shared/runtime/RuntimeManifest');
const RuntimeHardwareCheck = require('../../shared/runtime/detect/RuntimeHardwareCheck');

class MusicRuntimeDetector {
  static KIND = 'music-inference';

  constructor({ catalog = new MusicRuntimeCatalog() } = {}) {
    this._catalog = catalog;
  }

  async detectRuntimes({ runtimesRoot, cuda, manualBinaries } = {}) {
    const wsl = process.platform === 'win32' ? await Wsl.detect() : null;
    const runtimes = [];
    for (const entry of this._entriesForHost()) {
      runtimes.push(await this._detectEntry(entry, { runtimesRoot, cuda, manualBinaries, wsl }));
    }
    return { runtimesRoot, platformKey: `${process.platform}-${process.arch}`, runtimes };
  }

  static hardwareEvaluation(entry, { cuda, wsl } = {}) {
    if (!cuda || !cuda.available) return { ready: false, note: RuntimeHardwareCheck.cudaUnavailableNote(cuda) };
    if (process.platform === 'win32') {
      if (!wsl || !wsl.wsl2) {
        return { ready: false, note: (wsl && wsl.note) || 'WSL2 is required on Windows. Run: wsl --install' };
      }
      if (!wsl.nvidiaDriverOk) {
        return { ready: false, note: wsl.note || 'The WSL distro cannot see the GPU (nvidia-smi failed inside WSL).' };
      }
    }
    return { ready: true, note: null };
  }

  _entriesForHost() {
    return this._catalog.getCatalog().filter((entry) => entry.kind === MusicRuntimeDetector.KIND
      && (!Array.isArray(entry.platforms) || entry.platforms.includes(process.platform)));
  }

  async _detectEntry(entry, { runtimesRoot, cuda, manualBinaries, wsl }) {
    const managedDir = path.join(runtimesRoot, entry.id);
    const manifest = await RuntimeManifest.read(managedDir);
    const manualBinaryPath = (manualBinaries && manualBinaries[entry.id]) || null;
    const found = (await this._managedInstall(manifest)) || (await this._manualInstall(manualBinaryPath, wsl)) || MusicRuntimeDetector._NOT_FOUND;
    return {
      ...MusicRuntimeDetector._entryFacts(entry),
      ...found,
      managedDir,
      manifest,
      manualBinaryPath,
      staleManualRegistration: !!(manualBinaryPath && !found.installed),
      ...MusicRuntimeDetector._acquisitionFacts(wsl),
      hardware: MusicRuntimeDetector.hardwareEvaluation(entry, { cuda, wsl }),
      wsl: MusicRuntimeDetector._wslSummary(wsl),
    };
  }

  async _managedInstall(manifest) {
    if (!manifest || !manifest.binPath) return null;
    const ok = manifest.mode === 'wsl'
      ? await MusicRuntimeDetector._existsInWsl(manifest.distro, manifest.binPath)
      : await MusicRuntimeDetector._isExecutable(manifest.binPath);
    if (!ok) return null;
    const version = (manifest.package && manifest.package.version) || null;
    return { installed: true, source: 'managed', binaryPath: manifest.binPath, version };
  }

  async _manualInstall(manualBinaryPath, wsl) {
    if (!manualBinaryPath) return null;
    const ok = process.platform === 'win32' && manualBinaryPath.startsWith('/')
      ? await MusicRuntimeDetector._existsInWsl((wsl && wsl.distro) || null, manualBinaryPath)
      : await MusicRuntimeDetector._isExecutable(manualBinaryPath);
    return ok ? { installed: true, source: 'manual', binaryPath: manualBinaryPath, version: null } : null;
  }

  static _NOT_FOUND = Object.freeze({ installed: false, source: null, binaryPath: null, version: null });

  static _entryFacts(entry) {
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      description: entry.description,
      requirementNote: entry.requirementNote || null,
      pythonPackage: entry.pythonPackage,
      protocol: entry.protocol,
      platforms: Array.isArray(entry.platforms) ? entry.platforms.slice() : null,
    };
  }

  static _acquisitionFacts(wsl) {
    return {
      acquisition: 'python-env',
      assetSupported: process.platform === 'linux' || !!(wsl && wsl.wsl2 && wsl.nvidiaDriverOk),
      supportsManualRegister: true,
      manualSourceUrl: null,
      manualSourceNote: null,
    };
  }

  static _wslSummary(wsl) {
    if (!wsl) return null;
    return { present: wsl.present, wsl2: wsl.wsl2, distro: wsl.distro, nvidiaDriverOk: wsl.nvidiaDriverOk, note: wsl.note };
  }

  static async _existsInWsl(distro, filePath) {
    const result = await Wsl.runInWsl(distro, `test -x ${WslFormat.shellQuote(filePath)}`);
    return !!(result && result.ok);
  }

  static async _isExecutable(filePath) {
    try {
      await fs.promises.access(filePath, fs.constants.X_OK);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = MusicRuntimeDetector;
