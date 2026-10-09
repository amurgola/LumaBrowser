const RuntimeCatalog = require('../../shared/runtime/RuntimeCatalog');

class MusicRuntimeCatalog extends RuntimeCatalog {
  static REQUIREMENT_NOTE = process.platform === 'win32'
    ? 'Needs an NVIDIA GPU with the CUDA 12 driver, plus WSL2 with the NVIDIA WSL driver.'
    : 'Needs an NVIDIA GPU and the CUDA 12 driver runtime.';

  static RUNTIMES = [
    {
      id: 'sglang-omni',
      name: 'SGLang-Omni',
      kind: 'music-inference',
      description:
        'Serving stack for audio/omni models (MiniMax-Music3). Python-based, NVIDIA CUDA only. '
        + 'On Windows it runs inside WSL2.',
      acquisition: 'python-env',
      pythonPackage: {
        name: 'sglang-omni',
        version: '0.1.1',
        python: '3.12',
        sourceArchive: {
          ref: '847a727f70a80ab2700ca507aed3ddfbfc320eb0',
          url: 'https://github.com/sgl-project/sglang-omni/archive/847a727f70a80ab2700ca507aed3ddfbfc320eb0.tar.gz',
        },
        extraPackages: ['ninja'],
        envRevision: 2,
      },
      pypi: { project: 'sglang-omni' },
      platforms: ['linux', 'win32'],
      requiresHw: { kind: 'nvidia-cuda', cudaMajor: 12 },
      requirementNote: MusicRuntimeCatalog.REQUIREMENT_NOTE,
      protocol: 'sgl-omni-audio',
    },
  ];

  constructor() {
    super(MusicRuntimeCatalog.RUNTIMES);
  }
}

module.exports = MusicRuntimeCatalog;
