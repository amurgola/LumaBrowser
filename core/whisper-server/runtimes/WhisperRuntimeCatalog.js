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
      'No prebuilt macOS server binary. Build with: cmake -B build && cmake --build build --config Release, then use Locate to register build/bin/whisper-server.',
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
        'linux-x64': /^whisper-bin-ubuntu-x64\.(?:tar\.gz|tgz|zip)$/i,
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
        'NVIDIA GPU speech-to-text via cuBLAS. Near-instant transcription; requires a CUDA 12 driver.',
      repo: { owner: 'ggml-org', repo: 'whisper.cpp' },
      assetPatterns: {
        'win32-x64': /^whisper-cublas-12(?:[\d.]*)-bin-x64\.zip$/i,
      },
      binaryNames: WhisperRuntimeCatalog.BINARY_NAMES,
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: 'Needs an NVIDIA GPU and the CUDA 12 driver runtime.',
      ...WhisperRuntimeCatalog.MANUAL_DARWIN,
    },
  ];

  constructor() {
    super(WhisperRuntimeCatalog.RUNTIMES);
  }
}

module.exports = WhisperRuntimeCatalog;
