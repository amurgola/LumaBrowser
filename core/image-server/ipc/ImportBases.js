const GIB = 1024 * 1024 * 1024;

class ImportBases {
  static COMPATIBLE_RUNTIMES = Object.freeze(['sd-cpp-cuda12', 'sd-cpp-vulkan', 'sd-cpp-cpu']);

  static SPLIT_DIFFUSION = Object.freeze(['qwen-image-edit', 'qwen-image-2-1', 'anima']);

  static QWEN_COMPANION_BASES = Object.freeze(['qwen-image-edit', 'qwen-image-2-1']);

  static BASES = Object.freeze({
    'sd-1-5': {
      family: 'sd-1-5',
      kind: 'generate',
      defaults: { width: 512, height: 512, steps: 20, cfgScale: 7.0, sampler: 'euler_a' },
      minVramBytes: 4 * GIB,
    },
    'sdxl': {
      family: 'sdxl',
      kind: 'generate',
      defaults: { width: 1024, height: 1024, steps: 20, cfgScale: 6.5, sampler: 'dpm++2m', scheduler: 'karras' },
      minVramBytes: 6 * GIB,
    },
    'flux': {
      family: 'flux',
      kind: 'generate',
      defaults: { width: 1024, height: 1024, steps: 20, cfgScale: 1.0, sampler: 'euler' },
      minVramBytes: 8 * GIB,
      launchArgs: ['--clip-on-cpu'],
    },
    'qwen-image-edit': {
      family: 'qwen-image-edit',
      kind: 'edit',
      defaults: { width: 1024, height: 1024, steps: 4, cfgScale: 1.0, sampler: 'euler_a', scheduler: 'sgm_uniform' },
      minVramBytes: 16 * GIB,
      launchArgs: ['--flow-shift', '3', '--type', 'q4_K'],
    },
    'qwen-image-2-1': {
      family: 'qwen-image-2',
      kind: 'generate',
      supportsEdit: true,
      defaults: { width: 1024, height: 1024, steps: 25, cfgScale: 1.0, sampler: 'euler' },
      constraints: { dimensionMultiple: 32 },
      minVramBytes: 12 * GIB,
      launchArgs: ['--clip-on-cpu'],
    },
    'anima': {
      family: 'anima',
      kind: 'generate',
      defaults: {
        width: 1024,
        height: 1024,
        steps: 25,
        cfgScale: 4.0,
        sampler: 'dpm++2m',
        promptPrefix: 'masterpiece, best quality, score_7, highres, ',
        negativePrompt: 'worst quality, low quality, score_1, score_2, score_3, artist name, jpeg artifacts',
      },
      minVramBytes: 6 * GIB,
      launchArgs: [],
      licenseNote:
        'CircleStone Labs Non-Commercial License, built on NVIDIA Cosmos-Predict2 '
        + '(NVIDIA Open Model License). Free for personal, non-commercial use; '
        + 'contact CircleStone Labs (tdrussell@circlestone.ai) for commercial licensing.',
    },
  });

  static get(baseType) {
    return Object.prototype.hasOwnProperty.call(ImportBases.BASES, baseType) ? ImportBases.BASES[baseType] : null;
  }

  static names() {
    return Object.keys(ImportBases.BASES);
  }

  static isSplitDiffusion(baseType) {
    return ImportBases.SPLIT_DIFFUSION.includes(baseType);
  }
}

module.exports = ImportBases;
