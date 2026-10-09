const { app } = require('electron');
const GpuAdapterMatcher = require('./GpuAdapterMatcher');

class GpuProbe {
  static MIB = 1024 * 1024;

  static async probe({ nvidiaByName, nvidiaByPci, winRegistryVram } = {}) {
    try {
      const info = await app.getGPUInfo('complete');
      const devices = Array.isArray(info && info.gpuDevice) ? info.gpuDevice : [];
      const enriched = devices.map((d) => GpuProbe._enrich(GpuProbe._baseAdapter(d), { nvidiaByName, nvidiaByPci, winRegistryVram }));
      return GpuProbe._summary(GpuAdapterMatcher.dedupe(enriched), info);
    } catch (err) {
      return { available: false, reason: err.message };
    }
  }

  static _baseAdapter(device) {
    return {
      vendorId: device.vendorId,
      deviceId: device.deviceId,
      vendor: GpuAdapterMatcher.vendorName(device.vendorId),
      driverVendor: device.driverVendor || null,
      driverVersion: device.driverVersion || null,
      driverDate: device.driverDate || null,
      deviceString: device.deviceString || null,
      displayName: (device.deviceString || '').trim() || null,
      active: !!device.active,
      vramTotalBytes: null,
      vramFreeBytes: null,
      vramSource: null,
      pcie: null,
    };
  }

  static _enrich(adapter, { nvidiaByName, nvidiaByPci, winRegistryVram }) {
    const name = adapter.displayName || '';
    const nvidia = GpuAdapterMatcher.matchNvidiaByPci(adapter, nvidiaByPci)
      || GpuAdapterMatcher.matchNvidiaByName(name, nvidiaByName);
    if (nvidia) GpuProbe._applyNvidia(adapter, nvidia);
    else if (winRegistryVram) GpuProbe._applyRegistry(adapter, GpuAdapterMatcher.matchRegistry(name, winRegistryVram));
    return adapter;
  }

  static _applyNvidia(adapter, nvidia) {
    if (nvidia.memoryTotalMB != null) adapter.vramTotalBytes = nvidia.memoryTotalMB * GpuProbe.MIB;
    if (nvidia.memoryFreeMB != null) adapter.vramFreeBytes = nvidia.memoryFreeMB * GpuProbe.MIB;
    adapter.vramSource = 'nvidia-smi';
    if (nvidia.pcie) adapter.pcie = nvidia.pcie;
    if (!adapter.displayName && nvidia.name) adapter.displayName = nvidia.name;
  }

  static _applyRegistry(adapter, row) {
    if (!row || !row.MemBytes) return;
    adapter.vramTotalBytes = Number(row.MemBytes);
    adapter.vramSource = 'win-registry';
    if (!adapter.displayName && row.DriverDesc) adapter.displayName = row.DriverDesc;
  }

  static _summary(adapters, info) {
    const aux = (info && info.auxAttributes) || {};
    return {
      available: true,
      adapters,
      totalVramBytes: adapters.reduce((sum, a) => sum + (a.vramTotalBytes != null ? a.vramTotalBytes : 0), 0),
      freeVramBytes: adapters.reduce((sum, a) => sum + (a.vramFreeBytes != null ? a.vramFreeBytes : 0), 0),
      features: (info && info.featureStatus) || {},
      glRenderer: aux.glRenderer || null,
      glVendor: aux.glVendor || null,
      glVersion: aux.glVersion || null,
    };
  }
}

module.exports = GpuProbe;
