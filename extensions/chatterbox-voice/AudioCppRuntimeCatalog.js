const CoreRequire = require('./CoreRequire');

const RuntimeCatalog = CoreRequire.load('shared/runtime/RuntimeCatalog');

class AudioCppRuntimeCatalog extends RuntimeCatalog {
  static REPO = { owner: '0xShug0', repo: 'audio.cpp' };
  static KIND = 'audio-inference';
  static BIN_NAMES = {
    win32: ['audiocpp_server.exe'],
    linux: ['audiocpp_server'],
    darwin: ['audiocpp_server'],
  };

  static PREFERENCE = ['audiocpp-cuda13', 'audiocpp-cuda12', 'audiocpp-metal', 'audiocpp-vulkan', 'audiocpp-cpu'];

  static RUNTIMES = [
    {
      id: 'audiocpp-cuda12',
      name: 'audio.cpp (CUDA 12)',
      kind: AudioCppRuntimeCatalog.KIND,
      backend: 'cuda',
      description: 'NVIDIA GPU build. Fastest: a sentence in well under a second on a recent card. Needs a CUDA 12 driver.',
      repo: AudioCppRuntimeCatalog.REPO,
      assetPatterns: { 'win32-x64': /^audio-v[\d.]+-bin-windows-x64-cuda12(?:\.\d+)?\.zip$/i },
      companionAssets: { 'win32-x64': /^audio-v[\d.]+-cudart-windows-x64-cuda12(?:\.\d+)?\.zip$/i },
      binaryNames: AudioCppRuntimeCatalog.BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU with a CUDA 12 driver.',
      sizeNote: '~1 GB (engine + CUDA runtime)',
    },
    {
      id: 'audiocpp-cuda13',
      name: 'audio.cpp (CUDA 13)',
      kind: AudioCppRuntimeCatalog.KIND,
      backend: 'cuda',
      description: 'NVIDIA GPU build for CUDA 13 drivers (RTX 50-series and newer drivers).',
      repo: AudioCppRuntimeCatalog.REPO,
      assetPatterns: { 'win32-x64': /^audio-v[\d.]+-bin-windows-x64-cuda13(?:\.\d+)?\.zip$/i },
      companionAssets: { 'win32-x64': /^audio-v[\d.]+-cudart-windows-x64-cuda13(?:\.\d+)?\.zip$/i },
      binaryNames: AudioCppRuntimeCatalog.BIN_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 13 },
      requirementNote: 'Needs an NVIDIA GPU with a CUDA 13 driver.',
      sizeNote: '~850 MB (engine + CUDA runtime)',
    },
    {
      id: 'audiocpp-vulkan',
      name: 'audio.cpp (Vulkan)',
      kind: AudioCppRuntimeCatalog.KIND,
      backend: 'vulkan',
      description: 'Any modern GPU (AMD, Intel, NVIDIA) through Vulkan.',
      repo: AudioCppRuntimeCatalog.REPO,
      assetPatterns: {
        'win32-x64': /^audio-v[\d.]+-bin-windows-x64-vulkan\.zip$/i,
        'linux-x64': /^audio-v[\d.]+-bin-ubuntu-x64-vulkan\.tar\.gz$/i,
      },
      binaryNames: AudioCppRuntimeCatalog.BIN_NAMES,
      requiresHw: null,
      sizeNote: '~60-80 MB',
    },
    {
      id: 'audiocpp-metal',
      name: 'audio.cpp (Metal)',
      kind: AudioCppRuntimeCatalog.KIND,
      backend: 'metal',
      description: 'Apple Silicon and Intel Macs through Metal.',
      repo: AudioCppRuntimeCatalog.REPO,
      assetPatterns: {
        'darwin-arm64': /^audio-v[\d.]+-bin-macos-arm64-metal\.tar\.gz$/i,
        'darwin-x64': /^audio-v[\d.]+-bin-macos-x64-metal\.tar\.gz$/i,
      },
      binaryNames: AudioCppRuntimeCatalog.BIN_NAMES,
      requiresHw: null,
      sizeNote: '~30 MB',
    },
    {
      id: 'audiocpp-cpu',
      name: 'audio.cpp (CPU)',
      kind: AudioCppRuntimeCatalog.KIND,
      backend: 'cpu',
      description: 'Works everywhere, but Chatterbox is a 0.5B model: expect a sentence to take longer than it lasts.',
      repo: AudioCppRuntimeCatalog.REPO,
      assetPatterns: {
        'win32-x64': /^audio-v[\d.]+-bin-windows-x64-cpu\.zip$/i,
        'linux-x64': /^audio-v[\d.]+-bin-ubuntu-x64-cpu\.tar\.gz$/i,
      },
      binaryNames: AudioCppRuntimeCatalog.BIN_NAMES,
      requiresHw: null,
      sizeNote: '~25-50 MB',
    },
  ];

  static shared = new AudioCppRuntimeCatalog();

  constructor(runtimes = AudioCppRuntimeCatalog.RUNTIMES) {
    super(runtimes);
  }

  availableForHost() {
    return AudioCppRuntimeCatalog.PREFERENCE.filter((id) => !!this.getAssetPattern(this.getById(id)));
  }
}

module.exports = AudioCppRuntimeCatalog;
