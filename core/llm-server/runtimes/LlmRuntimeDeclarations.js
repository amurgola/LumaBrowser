class LlmRuntimeDeclarations {
  static LLAMA_BIN_NAMES = {
    win32: ['llama-server.exe', 'llama-cli.exe', 'main.exe'],
    linux: ['llama-server', 'llama-cli', 'main'],
    darwin: ['llama-server', 'llama-cli', 'main'],
  };

  static GGML_ORG = { owner: 'ggml-org', repo: 'llama.cpp' };

  static LLAMA_MANUAL_SOURCE_NOTE =
    'To use your own build instead: cmake -B build -DGGML_CUDA=ON && cmake --build build --config Release, then use Locate to register build/bin/llama-server.';

  static WIN_CUDA12_ASSET = /^llama-.+-bin-win-cuda[-_]?(?:cu)?[-_]?12(?:\.\d+)?-x64\.zip$/i;

  static WIN_CUDA12_CUDART = /^cudart-llama-bin-win-cu?(?:da[-_]?)?12(?:\.\d+)?-x64\.zip$/i;

  static LINUX_CUDA12_ASSET = /^llama-.+-bin-ubuntu-cuda-12(?:\.\d+)?-x64\.(?:tar\.gz|tgz|zip)$/i;

  static LINUX_CUDA12_CUDART = /^cudart-llama-.*bin-ubuntu-cuda-12(?:\.\d+)?-x64\.(?:tar\.gz|tgz|zip)$/i;

  static RUNTIMES = [
    {
      id: 'llama-cpp-cpu',
      name: 'llama.cpp (CPU)',
      kind: 'inference',
      description:
        'Pure CPU inference. Works on every host without GPU dependencies; slowest, but the universal fallback.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-cpu-x64\.zip$/i,
        'win32-arm64': /^llama-.+-bin-win-cpu-arm64\.zip$/i,
        'linux-x64': /^llama-.+-bin-ubuntu-x64\.(?:zip|tar\.gz|tgz)$/i,
        'darwin-arm64': /^llama-.+-bin-macos-arm64\.(?:zip|tar\.gz|tgz)$/i,
        'darwin-x64': /^llama-.+-bin-macos-x64\.(?:zip|tar\.gz|tgz)$/i,
      },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: null,
      protocol: 'openai-compat',
      hostLabels: {
        'darwin-arm64': {
          name: 'llama.cpp (Metal)',
          description: 'Apple-Silicon GPU acceleration via Metal, using unified memory. The standard llama.cpp build for M-series Macs; layers the GPU cannot hold run on the CPU.',
        },
      },
    },
    {
      id: 'llama-cpp-cuda12',
      name: 'llama.cpp (CUDA 12)',
      kind: 'inference',
      description:
        'NVIDIA GPU acceleration via CUDA 12. Fastest path on NVIDIA hardware; requires a CUDA-capable driver.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': LlmRuntimeDeclarations.WIN_CUDA12_ASSET,
        'linux-x64': LlmRuntimeDeclarations.LINUX_CUDA12_ASSET,
      },
      manualSourceUrl: 'https://github.com/ggml-org/llama.cpp',
      manualSourceNote: LlmRuntimeDeclarations.LLAMA_MANUAL_SOURCE_NOTE,
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime.',
      protocol: 'openai-compat',
      backendDevice: 'CUDA',
      backendLib: 'cuda',
      companionAssets: {
        'win32-x64': LlmRuntimeDeclarations.WIN_CUDA12_CUDART,
        'linux-x64': LlmRuntimeDeclarations.LINUX_CUDA12_CUDART,
      },
    },
    {
      id: 'llama-cpp-cuda13',
      name: 'llama.cpp (CUDA 13)',
      kind: 'inference',
      description:
        'NVIDIA GPU acceleration via CUDA 13. Ships native Blackwell (RTX 50-series) kernels; on the CUDA 12 build those cards fall back to slower driver-JIT-compiled code with long first loads. Needs a driver new enough to report CUDA 13 (R580+).',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-cuda[-_]?(?:cu)?[-_]?13(?:\.\d+)?-x64\.zip$/i,
        'win32-arm64': /^llama-.+-bin-win-cuda[-_]?(?:cu)?[-_]?13(?:\.\d+)?-arm64\.zip$/i,
        'linux-x64': /^llama-.+-bin-ubuntu-cuda-13(?:\.\d+)?-x64\.(?:tar\.gz|tgz|zip)$/i,
      },
      manualSourceUrl: 'https://github.com/ggml-org/llama.cpp',
      manualSourceNote: LlmRuntimeDeclarations.LLAMA_MANUAL_SOURCE_NOTE,
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 13 },
      requirementNote: 'Needs an NVIDIA GPU and a CUDA 13 driver (R580 or newer). Recommended for RTX 50-series.',
      protocol: 'openai-compat',
      backendDevice: 'CUDA',
      backendLib: 'cuda',
      companionAssets: {
        'win32-x64': /^cudart-llama-bin-win-cu?(?:da[-_]?)?13(?:\.\d+)?-x64\.zip$/i,
        'win32-arm64': /^cudart-llama-bin-win-cu?(?:da[-_]?)?13(?:\.\d+)?-arm64\.zip$/i,
        'linux-x64': /^cudart-llama-.*bin-ubuntu-cuda-13(?:\.\d+)?-x64\.(?:tar\.gz|tgz|zip)$/i,
      },
    },
    {
      id: 'llama-cpp-luma',
      name: 'llama.cpp (LumaByte)',
      kind: 'inference',
      description:
        "LumaByte's patched llama.cpp build (CUDA 12): upstream plus the luma-llamacpp patch stack. Faster model loading tuned for RAM-pinned model swapping, and slot save/restore that resumes hybrid-attention models across server restarts. Windows only for now.",
      repo: { owner: 'amurgola', repo: 'luma-llamacpp' },
      assetPatterns: { 'win32-x64': LlmRuntimeDeclarations.WIN_CUDA12_ASSET },
      manualSourceUrl: 'https://github.com/amurgola/luma-llamacpp',
      manualSourceNote:
        'To build locally: run scripts/checkout.ps1 then scripts/build-windows-cuda.ps1 in the luma-llamacpp repo, then use Locate to register work/llama.cpp/build/bin/llama-server.',
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime. Windows only for now.',
      protocol: 'openai-compat',
      backendDevice: 'CUDA',
      backendLib: 'cuda',
      companionAssets: { 'win32-x64': LlmRuntimeDeclarations.WIN_CUDA12_CUDART },
    },
    {
      id: 'llama-cpp-vulkan',
      name: 'llama.cpp (Vulkan)',
      kind: 'inference',
      description:
        'Cross-vendor GPU acceleration via Vulkan. Works on NVIDIA, AMD, Intel and Qualcomm Adreno GPUs that ship Vulkan drivers.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-vulkan-x64\.zip$/i,
        'win32-arm64': /^llama-.+-bin-win-vulkan-arm64\.zip$/i,
        'linux-x64': /^llama-.+-bin-ubuntu-vulkan-x64\.(?:zip|tar\.gz|tgz)$/i,
      },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'gpu-any' },
      requirementNote: 'Needs a GPU with a Vulkan driver; most modern AMD/Intel/NVIDIA cards and Snapdragon X Adreno GPUs qualify.',
      protocol: 'openai-compat',
      backendDevice: 'Vulkan',
      backendLib: 'vulkan',
    },
    {
      id: 'llama-cpp-opencl-adreno',
      name: 'llama.cpp (OpenCL, Adreno)',
      kind: 'inference',
      description:
        'Qualcomm Adreno GPU acceleration via OpenCL, for Snapdragon X Windows on Arm laptops. ggml-org builds it for Windows arm64 only; the Vulkan build reaches the same GPU with a less tuned path.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      platforms: ['win32-arm64'],
      assetPatterns: { 'win32-arm64': /^llama-.+-bin-win-opencl-adreno-arm64\.zip$/i },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'qualcomm-gpu' },
      requirementNote: 'Needs a Qualcomm Adreno GPU with its OpenCL driver (Snapdragon X on Windows on Arm).',
      protocol: 'openai-compat',
      backendDevice: 'GPUOpenCL',
      backendLib: 'opencl',
    },
    {
      id: 'llama-cpp-rocm',
      name: 'llama.cpp (ROCm)',
      kind: 'inference',
      description:
        'AMD GPU acceleration via ROCm/HIP. Usually faster than Vulkan on supported Radeon cards, but needs AMD\'s HIP runtime on the host (Windows: the AMD HIP SDK; Linux: ROCm). Vulkan works on the same cards without it.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-(?:rocm|hip)[-_][^-]+(?:-[^-]+)?-x64\.zip$/i,
        'linux-x64': /^llama-.+-bin-ubuntu-rocm[-_][\d.]+-x64\.(?:tar\.gz|tgz|zip)$/i,
      },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'amd-gpu' },
      requirementNote: 'Needs an AMD Radeon GPU that ROCm supports, plus the AMD HIP SDK (Windows, with its bin folder on PATH) or ROCm (Linux). The release bundles only the HIP runtime: hipBLAS, rocBLAS and hipBLASLt come from the SDK.',
      protocol: 'openai-compat',
      backendDevice: 'ROCm',
      backendLib: 'hip',
    },
    {
      id: 'llama-cpp-sycl',
      name: 'llama.cpp (SYCL)',
      kind: 'inference',
      description:
        'Intel GPU acceleration via SYCL/oneAPI (Arc, Battlemage and Core Ultra integrated graphics). Usually faster than Vulkan on Intel GPUs. The Windows build bundles its oneAPI runtime; on Linux the oneAPI runtime must be installed.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-sycl-x64\.zip$/i,
        'linux-x64': /^llama-.+-bin-ubuntu-sycl-fp16-x64\.(?:tar\.gz|tgz|zip)$/i,
      },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'intel-sycl' },
      requirementNote: 'Needs an Intel GPU with a current driver (Level Zero). On Linux, also the Intel Level Zero GPU driver (intel-level-zero-gpu or libze-intel-gpu1) and the oneAPI runtime (libsycl, MKL, oneDNN, Unified Runtime), which the release tarball does not bundle.',
      protocol: 'openai-compat',
      backendDevice: 'SYCL',
      backendLib: 'sycl',
    },
    {
      id: 'llama-cpp-openvino',
      name: 'llama.cpp (OpenVINO, experimental)',
      kind: 'inference',
      description:
        'Intel OpenVINO backend: runs on the Intel GPU by default, or on an Intel NPU or the CPU when the OpenVINO device in Defaults says so. Bundles the OpenVINO runtime; the Intel GPU and NPU drivers come from the host. Experimental: not every model architecture or quantization is supported, and NPUs suit small models.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-openvino(?:-[\d.]+)?-x64\.zip$/i,
        'linux-x64': /^llama-.+-bin-ubuntu-openvino(?:-[\d.]+)?-x64\.(?:tar\.gz|tgz|zip)$/i,
      },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'intel-openvino' },
      requirementNote: "Needs an Intel GPU with a current driver. On Linux the GPU runs through Intel's OpenCL compute runtime (intel-opencl-icd on Ubuntu, intel-compute-runtime on Arch; Mesa's rusticl is not a substitute), and the NPU through the Intel NPU user-space driver (intel-level-zero-npu) plus the Level Zero loader (libze1). Panther Lake needs compute-runtime 26.18 or newer.",
      protocol: 'openai-compat',
      backendDevice: 'OPENVINO',
      backendLib: 'openvino',
      spawnEnv: { GGML_OPENVINO_DEVICE: 'GPU' },
    },
    {
      id: 'mlx-lm',
      name: 'MLX (mlx-lm)',
      kind: 'inference',
      description:
        'Apple-Silicon GPU inference via MLX. Runs MLX-format models (mlx-community/*) natively on the Mac unified-memory GPU, the fastest local path on M-series hardware. Needs the mlx-lm Python package.',
      repo: { owner: 'ml-explore', repo: 'mlx-lm' },
      platforms: ['darwin'],
      acquisition: 'manual-source',
      manualSourceUrl: 'https://github.com/ml-explore/mlx-lm',
      manualSourceNote:
        'Install with: pip install mlx-lm (Python 3.9+ on Apple Silicon). Once mlx_lm.server is on your PATH it is detected here automatically.',
      binaryNames: { darwin: ['mlx_lm.server'] },
      protocol: 'openai-compat',
      launchStyle: 'mlx-server',
      requiresHw: { kind: 'apple-silicon' },
      requirementNote: 'Runs only on Apple Silicon (M-series) Macs.',
    },
  ];
}

module.exports = LlmRuntimeDeclarations;
