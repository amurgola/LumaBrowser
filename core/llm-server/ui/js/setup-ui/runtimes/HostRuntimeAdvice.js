export default class HostRuntimeAdvice {
  static TIERS = Object.freeze(['recommended', 'alternative', 'fallback', 'unsuited']);
  static BADGES = Object.freeze({ recommended: 'recommended for this PC', unsuited: 'not for this PC' });

  static forRows(rows, caps) {
    const host = HostRuntimeAdvice.host(caps);
    const out = {};
    for (const r of rows || []) {
      const advice = HostRuntimeAdvice.adviceFor(r, host);
      if (advice) out[r.id] = advice;
    }
    return out;
  }

  static host(caps) {
    const vendor = (v) => !!(caps && typeof caps.hasVendor === 'function' && caps.hasVendor(v));
    const cudaMajor = caps && typeof caps.cudaMajor === 'function' ? caps.cudaMajor() : 0;
    const nvidia = !!(caps && caps.cudaAvailable);
    const intel = vendor('Intel');
    const amd = vendor('AMD');
    const darwin = !!(caps && caps.platform === 'darwin');
    const gpu = !!(caps && caps.hasGpu);
    const npu = !!(caps && Array.isArray(caps.npus) && caps.npus.some((n) => n && n.vendor === 'Intel'));
    const npuUsable = !!(caps && typeof caps.intelNpuNames === 'function' && caps.intelNpuNames().length > 0);
    return { nvidia, cudaMajor, intel, amd, darwin, gpu, npu, npuUsable, primary: HostRuntimeAdvice._primary({ nvidia, cudaMajor, darwin, gpu }) };
  }

  static _primary({ nvidia, cudaMajor, darwin, gpu }) {
    if (darwin) return 'llama-cpp-cpu';
    if (nvidia) return cudaMajor >= 13 ? 'llama-cpp-cuda13' : 'llama-cpp-cuda12';
    return gpu ? 'llama-cpp-vulkan' : 'llama-cpp-cpu';
  }

  static backendOf(r) {
    const id = String((r && r.id) || '');
    if (/cuda|ninfer|luma/.test(id)) return 'cuda';
    if (/vulkan/.test(id)) return 'vulkan';
    if (/rocm|hip/.test(id)) return 'rocm';
    if (/sycl/.test(id)) return 'sycl';
    if (/openvino/.test(id)) return 'openvino';
    if (/mlx/.test(id)) return 'mlx';
    if (/cpu/.test(id)) return 'cpu';
    return null;
  }

  static adviceFor(r, host) {
    if (!r) return null;
    const backend = HostRuntimeAdvice.backendOf(r);
    if (!backend) return null;
    if (r.id === host.primary) return { tier: 'recommended', why: HostRuntimeAdvice._primaryWhy(backend, host) };
    if (r.assetSupported === false && !r.installed && r.acquisition !== 'extension') {
      return { tier: 'unsuited', why: 'No prebuilt download exists for this PC\'s platform; it could only be built from source.' };
    }
    const rule = HostRuntimeAdvice.RULES[backend];
    return rule ? rule(r, host) : null;
  }

  static _primaryWhy(backend, host) {
    if (host.darwin) return 'Apple Silicon: this build runs on the GPU through Metal with unified memory. Start here.';
    if (backend === 'cuda') {
      return host.cudaMajor >= 13
        ? 'Your NVIDIA driver reports CUDA 13: the fastest path, with native kernels for RTX 50-series cards. Start here.'
        : 'Your NVIDIA driver reports CUDA 12: the fastest path on this GPU. Start here.';
    }
    if (backend === 'vulkan') {
      if (host.intel) return 'Runs on your Intel GPU today through the Mesa Vulkan driver, with nothing extra to install. Start here.';
      if (host.amd) return 'Runs on your AMD GPU through the Mesa Vulkan driver, with no SDK to install. Start here.';
      return 'Runs on your GPU through its Vulkan driver, with nothing extra to install. Start here.';
    }
    return 'No GPU was detected, so the CPU build is the one that will run here.';
  }

  static RULES = Object.freeze({
    cuda: (r, host) => {
      if (!host.nvidia) return { tier: 'unsuited', why: 'Needs an NVIDIA GPU with a CUDA driver, which this machine does not have.' };
      if (/ninfer|luma/.test(r.id)) return { tier: 'alternative', why: 'A specialised NVIDIA build; use it when its row says your card is supported.' };
      if (/ik-llama/.test(r.id)) return { tier: 'alternative', why: 'The ik_llama.cpp fork: faster for some mixture-of-experts models; the standard CUDA build is the usual starting point.' };
      return { tier: 'alternative', why: host.cudaMajor >= 13 ? 'Works with your driver too; the CUDA 13 build above is faster on current cards.' : 'Needs a driver that reports CUDA 13 (R580 or newer); yours reports CUDA 12.' };
    },
    vulkan: (r, host) => {
      if (!host.gpu) return { tier: 'unsuited', why: 'Needs a GPU with a Vulkan driver; none was detected.' };
      if (/ik-llama/.test(r.id)) return { tier: 'alternative', why: 'The ik_llama.cpp fork on Vulkan: faster for some mixture-of-experts models; the standard Vulkan build is the usual starting point.' };
      return { tier: 'alternative', why: 'Works on any GPU through its Vulkan driver; slower than the vendor build recommended above.' };
    },
    rocm: (r, host) => (host.amd
      ? { tier: 'alternative', why: 'Often faster than Vulkan on supported Radeon cards, but needs the ROCm or HIP SDK installed. Try it after Vulkan.' }
      : { tier: 'unsuited', why: 'Needs an AMD Radeon GPU, which this machine does not have.' }),
    sycl: (r, host) => (host.intel
      ? { tier: 'alternative', why: 'Often faster than Vulkan on Intel GPUs, but on Linux it needs the oneAPI runtime libraries and the Intel compute runtime (see the GPU card). Try it after Vulkan.' }
      : { tier: 'unsuited', why: 'Needs an Intel GPU, which this machine does not have.' }),
    openvino: (r, host) => {
      if (!host.intel && !host.npu) return { tier: 'unsuited', why: 'Needs an Intel GPU or NPU, which this machine does not have.' };
      if (host.npu) {
        const drivers = host.npuUsable ? 'Its drivers are in place.' : 'Needs the Intel compute runtime and the NPU driver first (see the GPU card).';
        return { tier: 'alternative', why: `The only build that can use your Intel NPU (set the OpenVINO device to NPU in Defaults): small models at low power. Experimental, one request at a time. ${drivers}` };
      }
      return { tier: 'alternative', why: 'Intel\'s own backend for the GPU; experimental, and needs the Intel compute runtime (see the GPU card). Vulkan is the usual starting point.' };
    },
    mlx: (r, host) => (host.darwin
      ? { tier: 'alternative', why: 'The fastest path for MLX-format models (mlx-community) on Apple Silicon; needs the mlx-lm Python package.' }
      : { tier: 'unsuited', why: 'Runs only on Apple Silicon Macs.' }),
    cpu: (r, host) => {
      if (/ik-llama/.test(r.id)) return { tier: 'fallback', why: 'The ik_llama.cpp fork on the CPU alone; a last resort when every GPU build fails.' };
      return { tier: 'fallback', why: 'Always works, on the CPU alone, so the slowest; use it when a GPU build fails to load.' };
    },
  });

  static sortRows(rows, advice) {
    const rank = (r) => {
      const a = advice && advice[r.id];
      if (!a) return HostRuntimeAdvice.TIERS.length - 1;
      const i = HostRuntimeAdvice.TIERS.indexOf(a.tier);
      return a.tier === 'unsuited' ? HostRuntimeAdvice.TIERS.length : i;
    };
    return [...(rows || [])].map((r, i) => ({ r, i })).sort((x, y) => (rank(x.r) - rank(y.r)) || (x.i - y.i)).map((x) => x.r);
  }
}
