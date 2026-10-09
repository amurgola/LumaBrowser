const RuntimeCatalog = require('../../shared/runtime/RuntimeCatalog');

class ImageRuntimeCatalog extends RuntimeCatalog {
  static SD_BIN_NAMES = {
    win32: ['sd-server.exe', 'sd-cli.exe'],
    linux: ['sd-server', 'sd-cli'],
    darwin: ['sd-server', 'sd-cli'],
  };

  static CUDART_COMPANION = /^cudart-sd-bin-win-cu(?:da)?[-_]?12(?:\.\d+)?-x64\.zip$/i;

  static WIN_CUDA12_ASSET = /^sd-.+-bin-win-cuda[-_]?(?:cu)?[-_]?12(?:\.\d+)?-x64\.zip$/i;

  static RUNTIMES = [
    {
      id: 'sd-cpp-cpu',
      name: 'stable-diffusion.cpp (CPU)',
      kind: 'image-inference',
      description: 'Pure CPU image generation. Slow, but the universal fallback: runs anywhere without GPU drivers.',
      repo: { owner: 'leejet', repo: 'stable-diffusion.cpp' },
      assetPatterns: {
        'win32-x64': /^sd-.+-bin-win-(?:avx2|avx|noavx)-x64\.zip$/i,
        'linux-x64': /^sd-.+-bin-(?:linux-)?(?:ubuntu[-.\d]*)?-?(?:avx2|avx|noavx|x86_64|x64)\.(?:zip|tar\.gz|tgz)$/i,
        'darwin-arm64': /^sd-.+-bin-(?:darwin-)?macos(?:-[\d.]+)?-arm64\.(?:zip|tar\.gz|tgz)$/i,
        'darwin-x64': /^sd-.+-bin-(?:darwin-)?macos(?:-[\d.]+)?-(?:x64|x86_64)\.(?:zip|tar\.gz|tgz)$/i,
      },
      binaryNames: ImageRuntimeCatalog.SD_BIN_NAMES,
      requiresHw: null,
      protocol: 'sd-cpp-http',
    },
    {
      id: 'sd-cpp-cuda12',
      name: 'stable-diffusion.cpp (CUDA 12)',
      kind: 'image-inference',
      description: 'NVIDIA GPU acceleration via CUDA 12. Fastest path on NVIDIA hardware; requires a CUDA 12 driver.',
      repo: { owner: 'leejet', repo: 'stable-diffusion.cpp' },
      platforms: ['win32'],
      assetPatterns: { 'win32-x64': ImageRuntimeCatalog.WIN_CUDA12_ASSET },
      manualSourceUrl: 'https://github.com/leejet/stable-diffusion.cpp',
      manualSourceNote:
        'No prebuilt Linux CUDA binaries upstream. Build with: cmake -B build -DSD_CUDA=ON && cmake --build build --config Release, then use Locate to register the sd-server binary. Tip: the Vulkan runtime is prebuilt and also accelerates NVIDIA cards.',
      binaryNames: ImageRuntimeCatalog.SD_BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime.',
      protocol: 'sd-cpp-http',
      companionAssets: { 'win32-x64': ImageRuntimeCatalog.CUDART_COMPANION },
    },
    {
      id: 'sd-cpp-luma',
      name: 'stable-diffusion.cpp (LumaByte)',
      kind: 'image-inference',
      description:
        "LumaByte's patched stable-diffusion.cpp build (CUDA 12): upstream plus the luma-sdcpp patch stack. Reference images for an edit are prepared in a fraction of the time (a three-image Qwen-Image 2.1 edit went from 38 s to 12 s), with pixel-identical output. Windows only for now.",
      repo: { owner: 'amurgola', repo: 'luma-sdcpp' },
      platforms: ['win32'],
      assetPatterns: { 'win32-x64': ImageRuntimeCatalog.WIN_CUDA12_ASSET },
      manualSourceUrl: 'https://github.com/amurgola/luma-sdcpp',
      manualSourceNote:
        'To build locally: run scripts/checkout.ps1 then scripts/build-windows-cuda.ps1 in the luma-sdcpp repo, then use Locate to register work/stable-diffusion.cpp/build/bin/sd-server.',
      binaryNames: ImageRuntimeCatalog.SD_BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime. Windows only for now.',
      protocol: 'sd-cpp-http',
      companionAssets: { 'win32-x64': ImageRuntimeCatalog.CUDART_COMPANION },
    },
    {
      id: 'sd-cpp-vulkan',
      name: 'stable-diffusion.cpp (Vulkan)',
      kind: 'image-inference',
      description: 'Cross-vendor GPU acceleration via Vulkan. Works on NVIDIA, AMD, and Intel GPUs that ship Vulkan drivers.',
      repo: { owner: 'leejet', repo: 'stable-diffusion.cpp' },
      assetPatterns: {
        'win32-x64': /^sd-.+-bin-win-vulkan-x64\.zip$/i,
        'linux-x64': /^sd-.+-bin-(?:linux-)?(?:ubuntu[-.\d]*)?-?(?:x86_64|x64)-vulkan\.(?:zip|tar\.gz|tgz)$/i,
      },
      binaryNames: ImageRuntimeCatalog.SD_BIN_NAMES,
      requiresHw: { kind: 'gpu-any' },
      requirementNote: 'Needs a GPU with a Vulkan driver; most modern AMD/Intel/NVIDIA cards qualify.',
      protocol: 'sd-cpp-http',
    },
  ];

  constructor() {
    super(ImageRuntimeCatalog.RUNTIMES);
  }
}

module.exports = ImageRuntimeCatalog;
