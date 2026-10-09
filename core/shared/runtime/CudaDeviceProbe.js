const NvidiaSmi = require('./NvidiaSmi');

class CudaDeviceProbe {
  static MIB = 1024 * 1024;

  static _gpuCount = null;

  static gpuCount() {
    if (CudaDeviceProbe._gpuCount === null) CudaDeviceProbe._gpuCount = NvidiaSmi.queryGpuCountSync();
    return CudaDeviceProbe._gpuCount;
  }

  static readDevices(diagnostics) {
    const cached = CudaDeviceProbe.diagnosticsDevices(diagnostics);
    if (cached && cached.length > 0) return cached.map(CudaDeviceProbe._fromDiagnosticsDevice);
    return CudaDeviceProbe._liveDevices();
  }

  static withLiveMemory(diagnostics, { query } = {}) {
    try {
      const cached = CudaDeviceProbe.diagnosticsDevices(diagnostics);
      if (!cached || !cached.length) return diagnostics;
      const live = CudaDeviceProbe._liveRows(query);
      if (live.length !== cached.length) return diagnostics;
      return CudaDeviceProbe._overlayLiveMemory(diagnostics, cached, live);
    } catch (_) {
      return diagnostics;
    }
  }

  static readComputeApps() {
    return NvidiaSmi.queryComputeAppsSync();
  }

  static diagnosticsDevices(diagnostics) {
    const cuda = diagnostics && diagnostics.cuda;
    return cuda && cuda.available && Array.isArray(cuda.devices) ? cuda.devices : null;
  }

  static _fromDiagnosticsDevice(device, index) {
    return {
      index,
      name: device.name || `CUDA${index}`,
      totalBytes: (Number(device.memoryTotalMB) || 0) * CudaDeviceProbe.MIB,
      freeBytes: device.memoryFreeMB != null ? Number(device.memoryFreeMB) * CudaDeviceProbe.MIB : null,
    };
  }

  static _liveDevices() {
    return NvidiaSmi.queryGpusSync()
      .filter((row) => row.totalBytes > 0)
      .map((row, index) => ({
        index,
        name: row.name || `CUDA${index}`,
        totalBytes: row.totalBytes,
        freeBytes: row.freeBytes,
      }));
  }

  static _liveRows(query) {
    const rows = (query || (() => NvidiaSmi.queryGpusSync()))();
    return (rows || []).filter((row) => row && row.totalBytes > 0);
  }

  static _overlayLiveMemory(diagnostics, cached, live) {
    const MIB = CudaDeviceProbe.MIB;
    const devices = cached.map((device, i) => ({
      ...device,
      memoryTotalMB: Math.round(live[i].totalBytes / MIB),
      memoryFreeMB: live[i].freeBytes != null ? Math.round(live[i].freeBytes / MIB) : device.memoryFreeMB,
    }));
    return { ...diagnostics, cuda: { ...diagnostics.cuda, devices }, _liveMemoryAt: Date.now() };
  }
}

module.exports = CudaDeviceProbe;
