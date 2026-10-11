const LlamaDeviceVram = require('./LlamaDeviceVram');

class SharedGpuMemory {
  static GIB = 1024 * 1024 * 1024;
  static INTEGRATED_SHARE = 0.5;
  static INTEGRATED_MAX_DEDICATED_BYTES = 2 * SharedGpuMemory.GIB;
  static IGPU_VENDORS = new Set(['Intel', 'AMD']);

  static apply(gpu, { totalRamBytes, unified = null, cudaAvailable = false } = {}) {
    const hasAdapters = !!(gpu && Array.isArray(gpu.adapters));
    if (unified && unified.bytes > 0) {
      const summary = hasAdapters ? gpu : { ...(gpu || {}), available: true, adapters: [] };
      SharedGpuMemory._applyUnified(summary, unified);
      return SharedGpuMemory._retotal(summary);
    }
    if (!hasAdapters || cudaAvailable || !(totalRamBytes > 0)) return gpu;
    SharedGpuMemory._applyIntegrated(gpu, totalRamBytes);
    return SharedGpuMemory._retotal(gpu);
  }

  static isIntegrated(adapter) {
    if (!adapter || !SharedGpuMemory.IGPU_VENDORS.has(adapter.vendor)) return false;
    if (adapter.integrated === true) return true;
    return adapter.vramSource === 'win-registry' && adapter.vramTotalBytes > 0
      && adapter.vramTotalBytes < SharedGpuMemory.INTEGRATED_MAX_DEDICATED_BYTES;
  }

  static _applyUnified(summary, unified) {
    let adapter = summary.adapters.find((a) => a && a.vendor !== 'Microsoft');
    if (!adapter) {
      adapter = SharedGpuMemory._appleAdapter();
      summary.adapters.push(adapter);
    }
    if (!adapter.vendor || /^0x0$/.test(adapter.vendor)) adapter.vendor = 'Apple';
    if (!adapter.displayName) adapter.displayName = 'Apple GPU';
    Object.assign(adapter, { vramTotalBytes: unified.bytes, vramFreeBytes: null, vramSource: unified.source, unifiedMemory: true });
  }

  static _applyIntegrated(summary, totalRamBytes) {
    const adapters = summary.adapters.filter(Boolean);
    if (adapters.some((a) => SharedGpuMemory._isDiscrete(a))) return;
    const igpu = adapters.find((a) => SharedGpuMemory.isIntegrated(a));
    if (!igpu) return;
    const share = Math.floor(totalRamBytes * SharedGpuMemory.INTEGRATED_SHARE);
    const listed = Number(igpu.vramTotalBytes) || 0;
    if (igpu.vramSource === LlamaDeviceVram.SOURCE && listed >= share) {
      igpu.integrated = true;
      return;
    }
    Object.assign(igpu, {
      vramTotalBytes: Math.max(listed, share),
      vramFreeBytes: null,
      vramSource: 'shared-memory',
      integrated: true,
    });
  }

  static _isDiscrete(adapter) {
    if (adapter.vendor === 'NVIDIA') return true;
    return adapter.vendor !== 'Microsoft' && !SharedGpuMemory.isIntegrated(adapter)
      && adapter.vramTotalBytes >= SharedGpuMemory.INTEGRATED_MAX_DEDICATED_BYTES;
  }

  static _appleAdapter() {
    return {
      vendorId: 0x106b, deviceId: null, vendor: 'Apple', driverVendor: null, driverVersion: null, driverDate: null,
      deviceString: null, displayName: 'Apple GPU', active: true, vramTotalBytes: null, vramFreeBytes: null,
      vramSource: null, pcie: null,
    };
  }

  static _retotal(summary) {
    const sum = (key) => summary.adapters.reduce((total, a) => total + (a && a[key] != null ? a[key] : 0), 0);
    summary.totalVramBytes = sum('vramTotalBytes');
    summary.freeVramBytes = sum('vramFreeBytes');
    return summary;
  }
}

module.exports = SharedGpuMemory;
