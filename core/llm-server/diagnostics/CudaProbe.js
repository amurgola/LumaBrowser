const path = require('path');
const NvidiaSmi = require('../../shared/runtime/NvidiaSmi');
const DiagnosticsCommand = require('./DiagnosticsCommand');
const CudaDeviceParser = require('./CudaDeviceParser');
const UserPathScripts = require('./UserPathScripts');

class CudaProbe {
  static probe(options) {
    return new CudaProbe(options).probe();
  }

  constructor({ savedNvidiaSmiPath } = {}) {
    this._savedPath = savedNvidiaSmiPath || null;
    this._result = null;
    this._usedPath = null;
    this._discoveredPath = null;
    this._pathLookupOk = false;
  }

  async probe() {
    await this._resolveWorkingBinary();
    NvidiaSmi.setSmiPath(this._usedPath);
    if (!this._result.ok) return this._unavailable();
    return this._available();
  }

  async _resolveWorkingBinary() {
    if (await this._trySavedPath()) return;
    if (await this._tryBarePath()) return;
    if (DiagnosticsCommand.isBinaryMissing(this._result.reason)) await this._tryDiskDiscovery();
  }

  async _trySavedPath() {
    if (!this._savedPath) return false;
    const result = await CudaProbe._query(this._savedPath);
    if (!result.ok) return false;
    this._accept(result, this._savedPath);
    this._discoveredPath = this._savedPath;
    return true;
  }

  async _tryBarePath() {
    this._result = await CudaProbe._query(NvidiaSmi.BARE_NAME);
    this._pathLookupOk = this._result.ok;
    return this._result.ok;
  }

  async _tryDiskDiscovery() {
    const found = await NvidiaSmi.findOnDisk();
    if (!found) return;
    this._discoveredPath = found;
    const result = await CudaProbe._query(found);
    if (result.ok) this._accept(result, found);
    else this._result = result;
  }

  _accept(result, usedPath) {
    this._result = result;
    this._usedPath = usedPath;
  }

  _pathHint() {
    if (this._pathLookupOk || !this._usedPath) return null;
    const directory = path.dirname(this._usedPath);
    return {
      foundAt: this._usedPath,
      directory,
      powershellCommand: UserPathScripts.displayCommand(directory),
      canApplyAutomatically: process.platform === 'win32',
    };
  }

  _unavailable() {
    return {
      available: false,
      reason: this._result.reason || 'nvidia-smi not available',
      pathHint: this._pathHint(),
      discoveredPath: this._discoveredPath,
    };
  }

  async _available() {
    const devices = CudaDeviceParser.parseDevices(this._result.stdout);
    return {
      available: devices.length > 0,
      cudaVersion: await this._readCudaVersion(),
      devices,
      pathHint: this._pathHint(),
      discoveredPath: this._discoveredPath,
    };
  }

  async _readCudaVersion() {
    const result = await DiagnosticsCommand.run(this._usedPath || NvidiaSmi.BARE_NAME, CudaDeviceParser.VERSION_ARGS)
      .catch(() => null);
    return CudaDeviceParser.parseCudaVersion(result && result.stdout) || null;
  }

  static _query(binary) {
    return DiagnosticsCommand.run(binary, CudaDeviceParser.QUERY_ARGS);
  }
}

module.exports = CudaProbe;
