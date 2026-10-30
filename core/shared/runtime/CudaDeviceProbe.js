const NvidiaSmiStream = require('./NvidiaSmiStream');

class CudaDeviceProbe {
  static MIB = 1024 * 1024;

  static _gpuCount = null;
  static READY_MS = 3000;
  static FRESH_READ_TIMEOUT_MS = 2000;
  static stream = null;

  static whenReady(timeoutMs = CudaDeviceProbe.READY_MS) {
    const stream = CudaDeviceProbe._stream();
    if (typeof stream.whenReady !== 'function') return Promise.resolve(null);
    return stream.whenReady(timeoutMs).catch(() => null);
  }

  static gpuCount() {
    if (CudaDeviceProbe._gpuCount !== null) return CudaDeviceProbe._gpuCount;
    const snap = CudaDeviceProbe._stream().snapshot();
    const count = snap.rows.length;
    if (snap.outcome && snap.outcome.kind === 'ok') CudaDeviceProbe._gpuCount = count;
    return count;
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

  static async withFreshLiveMemory(diagnostics, { maxAgeMs = 0, timeoutMs = CudaDeviceProbe.FRESH_READ_TIMEOUT_MS } = {}) {
    try {
      const stream = CudaDeviceProbe._stream();
      if (typeof stream.refresh === 'function' && CudaDeviceProbe._running(stream)) {
        let timer = null;
        const timeout = new Promise((resolve) => { timer = setTimeout(resolve, timeoutMs); });
        await Promise.race([Promise.resolve(stream.refresh({ maxAgeMs })).catch(() => {}), timeout]);
        clearTimeout(timer);
      }
    } catch (_) {}
    return CudaDeviceProbe.withLiveMemory(diagnostics);
  }

  static liveCardTotals() {
    const snap = CudaDeviceProbe._stream().snapshot();
    if (!snap || !snap.outcome || snap.outcome.kind !== 'ok') return null;
    return CudaDeviceProbe._liveRows(() => snap.rows).map((row) => ({ index: row.index, totalBytes: row.totalBytes }));
  }

  static readComputeApps() {
    return CudaDeviceProbe._stream().cachedComputeApps();
  }

  static diagnosticsDevices(diagnostics) {
    const cuda = diagnostics && diagnostics.cuda;
    return cuda && cuda.available && Array.isArray(cuda.devices) ? cuda.devices : null;
  }

  static _stream() {
    return CudaDeviceProbe.stream || NvidiaSmiStream.shared;
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
    const stream = CudaDeviceProbe._stream();
    const snap = stream.snapshot();
    if (CudaDeviceProbe._unread(snap) && typeof stream.refresh === 'function' && CudaDeviceProbe._running(stream)) {
      Promise.resolve(stream.refresh()).catch(() => {});
    }
    return CudaDeviceProbe._toDevices(snap.rows);
  }

  static _unread(snap) {
    return snap.at == null && !!snap.outcome && snap.outcome.kind === 'none';
  }

  static _running(stream) {
    return typeof stream.isRunning !== 'function' || stream.isRunning();
  }

  static _toDevices(rows) {
    return (rows || [])
      .filter((row) => row && row.totalBytes > 0)
      .map((row, position) => {
        const index = Number.isInteger(row.index) ? row.index : position;
        return { index, name: row.name || `CUDA${index}`, totalBytes: row.totalBytes, freeBytes: row.freeBytes };
      });
  }

  static _liveRows(query) {
    const rows = query ? query() : CudaDeviceProbe._stream().snapshot().rows;
    return (rows || []).filter((row) => row && row.totalBytes > 0);
  }

  static _overlayLiveMemory(diagnostics, cached, live) {
    const MIB = CudaDeviceProbe.MIB;
    const devices = cached.map((device, i) => {
      const row = live.find((r) => r.index === i) || live[i];
      return {
        ...device,
        memoryTotalMB: Math.round(row.totalBytes / MIB),
        memoryFreeMB: row.freeBytes != null ? Math.round(row.freeBytes / MIB) : device.memoryFreeMB,
      };
    });
    return { ...diagnostics, cuda: { ...diagnostics.cuda, devices }, _liveMemoryAt: Date.now() };
  }
}

module.exports = CudaDeviceProbe;
