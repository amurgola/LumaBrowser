const CudaDeviceProbe = require('../../../shared/runtime/CudaDeviceProbe');

class RpcDeviceInventory {
  static MIB = 1024 * 1024;

  constructor({ llmServerService = null, readDevices = (diagnostics) => CudaDeviceProbe.readDevices(diagnostics) } = {}) {
    this._llmServerService = llmServerService;
    this._readDevices = readDevices;
  }

  probe() {
    const rows = this._liveRows();
    const devices = rows.length ? rows : this._cachedRows();
    return devices.map(RpcDeviceInventory._toInventoryRow);
  }

  _liveRows() {
    return this._safeRead(null);
  }

  _cachedRows() {
    const service = this._llmServerService;
    try {
      const diagnostics = service && service.getCachedDiagnostics ? service.getCachedDiagnostics() : null;
      return diagnostics ? this._safeRead(diagnostics) : [];
    } catch (_) {
      return [];
    }
  }

  _safeRead(diagnostics) {
    try {
      return this._readDevices(diagnostics) || [];
    } catch (_) {
      return [];
    }
  }

  static _toInventoryRow(device) {
    return {
      index: device.index,
      name: device.name,
      vramTotalMB: Math.round((Number(device.totalBytes) || 0) / RpcDeviceInventory.MIB),
      vramFreeMB: Math.round((Number(device.freeBytes) || 0) / RpcDeviceInventory.MIB),
    };
  }
}

module.exports = RpcDeviceInventory;
