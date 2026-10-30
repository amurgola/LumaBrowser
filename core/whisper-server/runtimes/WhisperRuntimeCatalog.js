const RuntimeCatalog = require('../../shared/runtime/RuntimeCatalog');

class WhisperRuntimeCatalog extends RuntimeCatalog {
  static BINARY_NAMES = {
    win32: ['whisper-server.exe'],
    linux: ['whisper-server'],
    darwin: ['whisper-server'],
  };

  static MANUAL_DARWIN = {
    manualSourceUrl: 'https://github.com/ggml-org/whisper.cpp',
    manualSourceNote:
      'No prebuilt server binary for this platform (upstream ships none for macOS). Build with: cmake -B build && cmake --build build --config Release, then use Locate to register build/bin/whisper-server.',
  };

  static RUNTIMES = [
    {
      id: 'whisper-cpp-cpu',
      name: 'whisper.cpp (CPU)',
      kind: 'stt-inference',
      description:
        'Pure CPU speech-to-text. Works on every host: transcribes a short utterance in a couple of seconds with the small model.',
      repo: { owner: 'ggml-org', repo: 'whisper.cpp' },
      assetPatterns: {
        'win32-x64': /^whisper-bin-x64\.zip$/i,
        'win32-arm64': /^whisper-bin-win-cpu-arm64\.zip$/i,
        'linux-x64': /^whisper-bin-ubuntu-x64\.(?:tar\.gz|tgz|zip)$/i,
        'linux-arm64': /^whisper-bin-ubuntu-arm64\.(?:tar\.gz|tgz|zip)$/i,
      },
      binaryNames: WhisperRuntimeCatalog.BINARY_NAMES,
      requiresHw: null,
      ...WhisperRuntimeCatalog.MANUAL_DARWIN,
    },
    {
      id: 'whisper-cpp-cublas',
      name: 'whisper.cpp (CUDA)',
      kind: 'stt-inference',
      description:
        'NVIDIA GPU speech-to-text via cuBLAS. Near-instant transcription; requires a CUDA 12 driver (CUDA 13 on Windows on Arm).',
      repo: { owner: 'ggml-org', repo: 'whisper.cpp' },
      assetPatterns: {
        'win32-x64': /^whisper-(?:cublas-12(?:[\d.]*)-bin|bin-win-cuda-12(?:[\d.]*))-x64\.zip$/i,
        'win32-arm64': /^whisper-bin-win-cuda-13(?:[\d.]*)-arm64\.zip$/i,
      },
      binaryNames: WhisperRuntimeCatalog.BINARY_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime; on Windows on Arm, a CUDA 13 driver (R580 or newer).',
      ...WhisperRuntimeCatalog.MANUAL_DARWIN,
    },
  ];

  constructor() {
    super(WhisperRuntimeCatalog.RUNTIMES);
  }
}

module.exports = WhisperRuntimeCatalog;
