const MemoryBandwidth = require('../MemoryBandwidth');

class HwBudget {
  static DEFAULT_CUDA_RUNTIME = 'llama-cpp-cuda12';

  static build(diagnostics, options = {}) {
    const diag = diagnostics || {};
    const budget = diag.budget || {};
    const vram = budget.vram || {};
    const ram = budget.ram || {};
    const gpu = HwBudget._gpuFacts(diag);
    return {
      usableVramBytes: vram.maxBytes || 0,
      vramTotalBytes: vram.totalBytes || 0,
      usableRamBytes: ram.maxBytes || 0,
      ramTotalBytes: ram.totalBytes || 0,
      cudaAvailable: gpu.cudaAvailable,
      cudaVersion: gpu.cudaVersion,
      hasGpu: gpu.hasGpu,
      gpuName: gpu.gpuName,
      cpuModel: (diag.cpu && diag.cpu.model) || null,
      cpuCores: (diag.cpu && diag.cpu.logicalCores) || null,
      gpus: HwBudget._perCardBudgets(vram.perAdapter),
      ramBandwidthGbps: MemoryBandwidth.resolveRamBandwidth(diag.memory).gbps,
      recommendedRuntimeId: HwBudget._recommendedRuntime(gpu, options.cudaRuntimePreference),
    };
  }

  static _gpuFacts(diag) {
    const cuda = diag.cuda || {};
    const adapters = (diag.gpu && diag.gpu.adapters) || [];
    const realGpu = adapters.find((a) => a.vendor && a.vendor !== 'Microsoft');
    const cudaAvailable = !!cuda.available;
    const firstCudaName = cuda.devices && cuda.devices[0] && cuda.devices[0].name;
    return {
      cudaAvailable,
      cudaVersion: cuda.cudaVersion || null,
      hasGpu: !!realGpu || cudaAvailable,
      gpuName: firstCudaName || (realGpu && realGpu.displayName) || null,
    };
  }

  static _perCardBudgets(perAdapter) {
    if (!Array.isArray(perAdapter)) return [];
    return perAdapter.map((a) => ({
      name: a.name || null,
      totalBytes: Number(a.totalBytes) || 0,
      maxBytes: Number(a.maxBytes) || 0,
    }));
  }

  static _recommendedRuntime(gpu, cudaRuntimePreference) {
    if (process.platform === 'darwin') return 'llama-cpp-cpu';
    if (gpu.cudaAvailable) return HwBudget._cudaPreference(gpu.cudaVersion, cudaRuntimePreference)[0];
    return gpu.hasGpu ? 'llama-cpp-vulkan' : 'llama-cpp-cpu';
  }

  static _cudaPreference(cudaVersion, cudaRuntimePreference) {
    if (typeof cudaRuntimePreference === 'function') return cudaRuntimePreference(cudaVersion);
    return [HwBudget.DEFAULT_CUDA_RUNTIME];
  }
}

module.exports = HwBudget;
