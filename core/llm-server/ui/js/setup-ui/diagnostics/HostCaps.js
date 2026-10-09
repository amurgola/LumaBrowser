export default class HostCaps {
  constructor() {
    this.cudaAvailable = false;
    this.cudaVersion = null;
    this.hasGpu = false;
  }

  update(diagnostics) {
    const cuda = diagnostics.cuda;
    const gpu = diagnostics.gpu;
    this.cudaAvailable = !!(cuda && cuda.available);
    this.cudaVersion = (cuda && cuda.cudaVersion) || null;
    this.hasGpu = !!(gpu && Array.isArray(gpu.adapters) && gpu.adapters.some((a) => a.vendor && a.vendor !== 'Microsoft'));
  }

  cudaMajor() {
    return Number(String(this.cudaVersion || '').split('.')[0]);
  }
}
