class LlmRuntimeDeclarations {
  static LLAMA_BIN_NAMES = {
    win32: ['llama-server.exe', 'llama-cli.exe', 'main.exe'],
    linux: ['llama-server', 'llama-cli', 'main'],
    darwin: ['llama-server', 'llama-cli', 'main'],
  };

  static GGML_ORG = { owner: 'ggml-org', repo: 'llama.cpp' };

  static JANHQ_LINUX = { 'linux-x64': { owner: 'janhq', repo: 'llama.cpp' } };

  static LLAMA_MANUAL_SOURCE_NOTE =
    'To use your own build instead: cmake -B build -DGGML_CUDA=ON && cmake --build build --config Release, then use Locate to register build/bin/llama-server.';

  static WIN_CUDA12_ASSET = /^llama-.+-bin-win-cuda[-_]?(?:cu)?[-_]?12(?:\.\d+)?-x64\.zip$/i;

  static WIN_CUDA12_CUDART = /^cudart-llama-bin-win-cu?(?:da[-_]?)?12(?:\.\d+)?-x64\.zip$/i;

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
        'linux-x64': /^llama-.+-bin-ubuntu-x64\.(?:zip|tar\.gz|tgz)$/i,
        'darwin-arm64': /^llama-.+-bin-macos-arm64\.(?:zip|tar\.gz|tgz)$/i,
        'darwin-x64': /^llama-.+-bin-macos-x64\.(?:zip|tar\.gz|tgz)$/i,
      },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: null,
      protocol: 'openai-compat',
    },
    {
      id: 'llama-cpp-cuda12',
      name: 'llama.cpp (CUDA 12)',
      kind: 'inference',
      description:
        'NVIDIA GPU acceleration via CUDA 12. Fastest path on NVIDIA hardware; requires a CUDA-capable driver.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      repos: LlmRuntimeDeclarations.JANHQ_LINUX,
      assetPatterns: {
        'win32-x64': LlmRuntimeDeclarations.WIN_CUDA12_ASSET,
        'linux-x64': /^llama-.+-bin-linux-cuda[-_]?12(?:[.-]\d+)?-common_cpus-x64\.(?:tar\.gz|tgz|zip)$/i,
      },
      manualSourceUrl: 'https://github.com/ggml-org/llama.cpp',
      manualSourceNote: LlmRuntimeDeclarations.LLAMA_MANUAL_SOURCE_NOTE,
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime.',
      protocol: 'openai-compat',
      companionAssets: {
        'win32-x64': LlmRuntimeDeclarations.WIN_CUDA12_CUDART,
        'linux-x64': [
          /^cudart-llama-bin-linux-cu(?:da)?[-_]?12(?:\.\d+)?-x64\.(?:tar\.gz|tgz|zip)$/i,
          {
            name: 'nccl_2.27.3-cuda12-x86_64 (NVIDIA redist)',
            url: 'https://developer.download.nvidia.com/compute/redist/nccl/v2.27.3/nccl_2.27.3-1+cuda12.9_x86_64.txz',
            extractGlobs: ['*/lib/libnccl.so*'],
          },
        ],
      },
    },
    {
      id: 'llama-cpp-cuda13',
      name: 'llama.cpp (CUDA 13)',
      kind: 'inference',
      description:
        'NVIDIA GPU acceleration via CUDA 13. Ships native Blackwell (RTX 50-series) kernels; on the CUDA 12 build those cards fall back to slower driver-JIT-compiled code with long first loads. Needs a driver new enough to report CUDA 13 (R580+).',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      repos: LlmRuntimeDeclarations.JANHQ_LINUX,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-cuda[-_]?(?:cu)?[-_]?13(?:\.\d+)?-x64\.zip$/i,
        'linux-x64': /^llama-.+-bin-linux-cuda[-_]?13(?:[.-]\d+)?-common_cpus-x64\.(?:tar\.gz|tgz|zip)$/i,
      },
      manualSourceUrl: 'https://github.com/ggml-org/llama.cpp',
      manualSourceNote: LlmRuntimeDeclarations.LLAMA_MANUAL_SOURCE_NOTE,
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 13 },
      requirementNote: 'Needs an NVIDIA GPU and a CUDA 13 driver (R580 or newer). Recommended for RTX 50-series.',
      protocol: 'openai-compat',
      companionAssets: {
        'win32-x64': /^cudart-llama-bin-win-cu?(?:da[-_]?)?13(?:\.\d+)?-x64\.zip$/i,
        'linux-x64': [
          /^cudart-llama-bin-linux-cu(?:da)?[-_]?13(?:\.\d+)?-x64\.(?:tar\.gz|tgz|zip)$/i,
          {
            name: 'nccl_2.28.9-cuda13-x86_64 (NVIDIA redist)',
            url: 'https://developer.download.nvidia.com/compute/redist/nccl/v2.28.9/nccl_2.28.9-1+cuda13.0_x86_64.txz',
            extractGlobs: ['*/lib/libnccl.so*'],
          },
        ],
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
      companionAssets: { 'win32-x64': LlmRuntimeDeclarations.WIN_CUDA12_CUDART },
    },
    {
      id: 'llama-cpp-vulkan',
      name: 'llama.cpp (Vulkan)',
      kind: 'inference',
      description:
        'Cross-vendor GPU acceleration via Vulkan. Works on NVIDIA, AMD, and Intel GPUs that ship Vulkan drivers.',
      repo: LlmRuntimeDeclarations.GGML_ORG,
      assetPatterns: {
        'win32-x64': /^llama-.+-bin-win-vulkan-x64\.zip$/i,
        'linux-x64': /^llama-.+-bin-ubuntu-vulkan-x64\.(?:zip|tar\.gz|tgz)$/i,
      },
      binaryNames: LlmRuntimeDeclarations.LLAMA_BIN_NAMES,
      requiresHw: { kind: 'gpu-any' },
      requirementNote: 'Needs a GPU with a Vulkan driver; most modern AMD/Intel/NVIDIA cards qualify.',
      protocol: 'openai-compat',
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
    {
      id: 'harmony',
      name: 'Harmony format',
      kind: 'format',
      description:
        "OpenAI's Harmony response format, used by gpt-oss-* models for prompts, reasoning, and tool calls. Not a separate binary: support is baked into recent llama.cpp builds (b6000+), so it lights up as soon as a current llama.cpp runtime is installed.",
      dependsOn: ['llama-cpp-cpu', 'llama-cpp-cuda12', 'llama-cpp-cuda13', 'llama-cpp-vulkan'],
      minLlamaBuild: 6000,
    },
  ];
}

module.exports = LlmRuntimeDeclarations;
