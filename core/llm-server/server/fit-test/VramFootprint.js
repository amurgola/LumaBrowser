const NvidiaSmiStream = require('../../../shared/runtime/NvidiaSmiStream');
const ProcessMemory = require('../../../shared/runtime/ProcessMemory');
const GpuProcessMemory = require('../../../shared/runtime/GpuProcessMemory');
const CancellableDelay = require('./CancellableDelay');

class VramFootprint {
  static BASELINE_SAMPLES = 4;
  static BASELINE_GAP_MS = 350;
  static MAX_READING_AGE_MS = 250;

  static streamQueries(stream = NvidiaSmiStream.shared) {
    return {
      queryGpus: async () => (await stream.refresh({ maxAgeMs: VramFootprint.MAX_READING_AGE_MS })).rows,
      queryComputeApps: () => stream.computeApps(),
    };
  }

  constructor({
    nvidiaSmi = VramFootprint.streamQueries(), processMemory = ProcessMemory, gpuProcessMemory = GpuProcessMemory,
    unifiedMemory = false, sleep = CancellableDelay.sleep,
  } = {}) {
    this._nvidiaSmi = nvidiaSmi;
    this._processMemory = processMemory;
    this._gpuProcessMemory = gpuProcessMemory;
    this._unifiedMemory = !!unifiedMemory;
    this._countersInflight = null;
    this._sleep = sleep;
    this._baselineFree = null;
    this._pid = null;
    this._peak = { vram: 0, ram: 0, vramSeen: false, ramSeen: false, minFree: Infinity, freeSeen: false };
    this._timer = null;
  }

  async captureBaseline() {
    let best = null;
    for (let i = 0; i < VramFootprint.BASELINE_SAMPLES; i++) {
      const free = await this._freeVramBytes();
      if (free != null && (best == null || free > best)) best = free;
      if (i < VramFootprint.BASELINE_SAMPLES - 1) await this._sleep(VramFootprint.BASELINE_GAP_MS);
    }
    this._baselineFree = best;
    return best;
  }

  track(pid) {
    this._pid = pid;
  }

  async sample() {
    const [vram, ram, free] = await Promise.all([
      this._processVramBytes(),
      this._processMemory.rssBytes(this._pid),
      this._freeVramBytes(),
    ]);
    const peak = this._peak;
    if (vram != null) { peak.vramSeen = true; if (vram > peak.vram) peak.vram = vram; }
    if (ram != null) { peak.ramSeen = true; if (ram > peak.ram) peak.ram = ram; }
    if (free != null) { peak.freeSeen = true; if (free < peak.minFree) peak.minFree = free; }
  }

  startSampling(intervalMs) {
    this._timer = setInterval(() => { this.sample().catch(() => {}); }, intervalMs);
  }

  stopSampling() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  resolve() {
    const peak = this._peak;
    if (peak.vramSeen && peak.vram > 0) return { vramBytes: peak.vram, vramApprox: false };
    if (!this._unifiedMemory && this._baselineFree != null && peak.freeSeen && Number.isFinite(peak.minFree)) {
      const delta = this._baselineFree - peak.minFree;
      if (delta > 0) return { vramBytes: delta, vramApprox: true };
    }
    return { vramBytes: null, vramApprox: false };
  }

  ramBytes() {
    return this._peak.ramSeen ? this._peak.ram : null;
  }

  async _processVramBytes() {
    if (!this._pid) return null;
    const apps = await this._nvidiaSmi.queryComputeApps();
    if (apps[this._pid] != null) return apps[this._pid];
    return this._counterVramBytes();
  }

  async _counterVramBytes() {
    if (!this._gpuProcessMemory || !this._gpuProcessMemory.applies()) return null;
    if (!this._countersInflight) {
      this._countersInflight = Promise.resolve(this._gpuProcessMemory.read(this._pid))
        .catch(() => null)
        .finally(() => { this._countersInflight = null; });
    }
    const usage = await this._countersInflight;
    return usage && usage.totalBytes > 0 ? usage.totalBytes : null;
  }

  async _freeVramBytes() {
    const rows = await this._nvidiaSmi.queryGpus();
    const free = rows.filter((r) => r.freeBytes != null);
    return free.length ? free.reduce((sum, r) => sum + r.freeBytes, 0) : null;
  }
}

module.exports = VramFootprint;
