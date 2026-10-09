const MediaModelCatalog = require('../../media-shared/MediaModelCatalog');

const GIB = 1024 ** 3;

class MusicModelCatalog extends MediaModelCatalog {
  static ENTRIES = [
    {
      id: 'minimax-music3',
      label: 'MiniMax-Music3',
      blurb:
        'Full songs with vocals from lyrics plus a style description, up to 5 minutes of '
        + '32 kHz stereo audio. Hierarchical 8B/0.6B LLM stack with flow-matching synthesis.',
      kind: 'music',
      hfRepo: 'MiniMaxAI/MiniMax-Music3',
      approxTotalBytes: 54 * GIB,
      arStageBytes: 20 * GIB,
      ditStageBytes: 13 * GIB,
      minVramBytes: 34 * GIB,
      dualGpuOk: true,
      constraints: {
        maxPromptTokens: 5000,
        maxAcousticFrames: 9000,
        sampleRate: 32000,
        maxDurationSec: 300,
      },
      launchProfiles: {
        single: ['--mem-fraction-static', '0.5'],
        dual: ['--mem-fraction-static', '0.8'],
      },
      defaults: { maxNewTokens: 9000 },
      apiModelName: 'MiniMaxAI/MiniMax-Music3',
      protocol: 'sgl-omni-audio',
      compatibleRuntimes: ['sglang-omni'],
      licenseNote: 'Creative Commons. See the model card for the exact variant and usage terms.',
    },
  ];

  constructor() {
    super(MusicModelCatalog.ENTRIES);
  }
}

module.exports = MusicModelCatalog;
