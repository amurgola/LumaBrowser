const fs = require('fs');

class RuntimeHardwareCheck {
  static READY = Object.freeze({ ready: true, note: null });
  static VULKAN_ICD_DIRS = ['/usr/share/vulkan/icd.d', '/etc/vulkan/icd.d'];

  static evaluate(entry, { cuda, gpu } = {}) {
    const req = entry && entry.requiresHw;
    if (!req) return { ...RuntimeHardwareCheck.READY };
    if (req.kind === 'nvidia-cuda') return RuntimeHardwareCheck._nvidiaCuda(req, cuda);
    if (req.kind === 'gpu-any') return RuntimeHardwareCheck._gpuAny(gpu);
    if (req.kind === 'apple-silicon') return RuntimeHardwareCheck._appleSilicon();
    return { ...RuntimeHardwareCheck.READY };
  }

  static linuxVulkanDeviceLikely(fsLike = fs) {
    try {
      if (fsLike.readdirSync('/dev/dri').some((n) => /^renderD[0-9]+$/.test(n))) return true;
    } catch (_) {}
    for (const dir of RuntimeHardwareCheck.VULKAN_ICD_DIRS) {
      try {
        if (fsLike.readdirSync(dir).some((n) => /nvidia/i.test(n))) return true;
      } catch (_) {}
    }
    return false;
  }

  static cudaUnavailableNote(cuda) {
    const reason = String((cuda && cuda.reason) || '');
    if (/driver\/library version mismatch|failed to initialize nvml/i.test(reason)) {
      return 'NVIDIA driver/library version mismatch: the driver was updated but the old kernel module is still loaded. Reboot to finish the driver update.';
    }
    return 'No CUDA-capable NVIDIA driver detected.';
  }

  static _nvidiaCuda(req, cuda) {
    if (!cuda || !cuda.available) return { ready: false, note: RuntimeHardwareCheck.cudaUnavailableNote(cuda) };
    const major = RuntimeHardwareCheck._cudaMajor(cuda.cudaVersion);
    if (req.cudaMajor != null && major != null && major < req.cudaMajor) {
      return { ready: false, note: `CUDA ${major}.x detected; this runtime needs CUDA ${req.cudaMajor}+.` };
    }
    if (req.gpuNameMatch && !RuntimeHardwareCheck._someGpuMatches(req.gpuNameMatch, cuda.devices)) {
      return { ready: false, note: req.gpuNameNote || `Needs a GPU matching "${req.gpuNameMatch}"; none detected.` };
    }
    return { ...RuntimeHardwareCheck.READY };
  }

  static _someGpuMatches(pattern, devices) {
    let re;
    try { re = new RegExp(String(pattern), 'i'); } catch (_) { return true; }
    return (Array.isArray(devices) ? devices : []).some((d) => d && re.test(String(d.name || '')));
  }

  static _gpuAny(gpu) {
    const hasGpu = !!(gpu && Array.isArray(gpu.adapters) && gpu.adapters.some((a) => a.vendor && a.vendor !== 'Microsoft'));
    if (!hasGpu) return { ready: false, note: 'No real GPU adapter detected. Vulkan needs a vendor driver.' };
    if (process.platform === 'linux' && !RuntimeHardwareCheck._vulkanDevice(gpu)) {
      return {
        ready: false,
        note: 'No GPU-backed Vulkan device found (only software Vulkan). Install your GPU vendor\'s Vulkan driver, or use the CPU runtime.',
      };
    }
    return { ...RuntimeHardwareCheck.READY };
  }

  static _vulkanDevice(gpu) {
    if (gpu && typeof gpu.vulkanDevice === 'boolean') return gpu.vulkanDevice;
    return RuntimeHardwareCheck.linuxVulkanDeviceLikely();
  }

  static _appleSilicon() {
    const ok = process.platform === 'darwin' && process.arch === 'arm64';
    return { ready: ok, note: ok ? null : 'Requires an Apple Silicon (arm64) Mac.' };
  }

  static _cudaMajor(version) {
    if (!version) return null;
    const match = String(version).match(/^(\d+)\./);
    return match ? Number(match[1]) : null;
  }
}

module.exports = RuntimeHardwareCheck;
