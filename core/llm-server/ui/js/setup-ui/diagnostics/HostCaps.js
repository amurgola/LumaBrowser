export default class HostCaps {
  constructor() {
    this.cudaAvailable = false;
    this.cudaVersion = null;
    this.hasGpu = false;
    this.platform = null;
    this.vendors = new Set();
    this.npus = [];
  }

  update(diagnostics) {
    const cuda = diagnostics.cuda;
    const gpu = diagnostics.gpu;
    this.cudaAvailable = !!(cuda && cuda.available);
    this.cudaVersion = (cuda && cuda.cudaVersion) || null;
    this.hasGpu = !!(gpu && Array.isArray(gpu.adapters) && gpu.adapters.some((a) => a.vendor && a.vendor !== 'Microsoft'));
    this.platform = (diagnostics.platform && diagnostics.platform.os) || null;
    this.vendors = new Set(gpu && Array.isArray(gpu.adapters) ? gpu.adapters.map((a) => a && a.vendor).filter(Boolean) : []);
    this.npus = (diagnostics.npu && Array.isArray(diagnostics.npu.devices)) ? diagnostics.npu.devices.filter(Boolean) : [];
  }

  intelNpuNames() {
    return this.npus.filter((n) => n.vendor === 'Intel' && n.usable !== false).map((n) => n.name || 'Intel NPU');
  }

  hasVendor(vendor) {
    return this.vendors.has(vendor);
  }

  cudaMajor() {
    return Number(String(this.cudaVersion || '').split('.')[0]);
  }
}
