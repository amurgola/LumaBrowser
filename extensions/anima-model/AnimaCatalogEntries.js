class AnimaCatalogEntries {
  static GB = 1024 * 1024 * 1024;

  static REPO = 'circlestone-labs/Anima';

  static COMPATIBLE_RUNTIMES = ['sd-cpp-cuda12', 'sd-cpp-vulkan', 'sd-cpp-cpu'];

  static LICENSE_NOTE =
    'CircleStone Labs Non-Commercial License, built on NVIDIA Cosmos-Predict2 '
    + '(NVIDIA Open Model License). Free for personal, non-commercial use; '
    + 'contact CircleStone Labs (tdrussell@circlestone.ai) for commercial licensing.';

  static PROMPT_PREFIX = 'masterpiece, best quality, score_7, highres, ';
  static NEGATIVE_PROMPT = 'worst quality, low quality, score_1, score_2, score_3, artist name, jpeg artifacts';

  static VAE_FILE = {
    role: 'vae',
    repo: AnimaCatalogEntries.REPO,
    file: 'qwen_image_vae.safetensors',
    url: 'https://huggingface.co/circlestone-labs/Anima/resolve/main/split_files/vae/qwen_image_vae.safetensors?download=true',
    approxBytes: 253806246,
  };

  static LLM_FILE = {
    role: 'llm',
    repo: AnimaCatalogEntries.REPO,
    file: 'qwen_3_06b_base.safetensors',
    url: 'https://huggingface.co/circlestone-labs/Anima/resolve/main/split_files/text_encoders/qwen_3_06b_base.safetensors?download=true',
    approxBytes: 1192135096,
  };

  static BASE = {
    id: 'anima',
    label: 'Anima (non-commercial)',
    blurb:
      'Anime-focused 2B text-to-image from CircleStone Labs × Comfy Org. '
      + 'Built on NVIDIA Cosmos-Predict2 with a Qwen3-0.6B text encoder for '
      + 'strong prompt adherence. ~5.3 GB across diffusion + text encoder + VAE.',
    family: 'anima',
    kind: 'generate',
    licenseNote: AnimaCatalogEntries.LICENSE_NOTE,
    files: {
      diffusion: AnimaCatalogEntries._diffusionFile('anima-base-v1.0.safetensors', 4182218328),
      vae: AnimaCatalogEntries.VAE_FILE,
      llm: AnimaCatalogEntries.LLM_FILE,
    },
    minVramBytes: 6 * AnimaCatalogEntries.GB,
    defaults: {
      width: 896,
      height: 1152,
      steps: 25,
      cfgScale: 4.0,
      sampler: 'dpm++2m',
      scheduler: 'sgm_uniform',
      promptPrefix: AnimaCatalogEntries.PROMPT_PREFIX,
      negativePrompt: AnimaCatalogEntries.NEGATIVE_PROMPT,
    },
    launchArgs: ['--cache-mode', 'easycache', '--cache-option', 'threshold=0.2'],
    protocol: 'sd-cpp-http',
    compatibleRuntimes: [...AnimaCatalogEntries.COMPATIBLE_RUNTIMES],
  };

  static TURBO = {
    id: 'anima-turbo',
    label: 'Anima Turbo (non-commercial)',
    blurb:
      'Official few-step distill of Anima, the same anime-focused 2B base from '
      + 'CircleStone Labs × Comfy Org, tuned for CFG 1 at 8 to 12 steps (~2.5x '
      + 'faster than the base model). Backgrounds render softer/bokeh; '
      + 'negative prompts are ignored at CFG 1.',
    family: 'anima',
    kind: 'generate',
    licenseNote: AnimaCatalogEntries.LICENSE_NOTE,
    files: {
      diffusion: AnimaCatalogEntries._diffusionFile('anima-turbo-v1.0.safetensors', 4182230656),
      vae: AnimaCatalogEntries.VAE_FILE,
      llm: AnimaCatalogEntries.LLM_FILE,
    },
    minVramBytes: 6 * AnimaCatalogEntries.GB,
    defaults: {
      width: 896,
      height: 1152,
      steps: 10,
      cfgScale: 1.0,
      sampler: 'euler',
      scheduler: 'sgm_uniform',
      promptPrefix: AnimaCatalogEntries.PROMPT_PREFIX,
      negativePrompt: AnimaCatalogEntries.NEGATIVE_PROMPT,
    },
    launchArgs: [],
    protocol: 'sd-cpp-http',
    compatibleRuntimes: [...AnimaCatalogEntries.COMPATIBLE_RUNTIMES],
  };

  static all() {
    return [AnimaCatalogEntries.BASE, AnimaCatalogEntries.TURBO];
  }

  static registerInto(catalog) {
    if (!catalog || typeof catalog.register !== 'function') return;
    for (const entry of AnimaCatalogEntries.all()) catalog.register(entry);
  }

  static _diffusionFile(file, approxBytes) {
    return {
      role: 'diffusion',
      repo: AnimaCatalogEntries.REPO,
      file,
      url: `https://huggingface.co/circlestone-labs/Anima/resolve/main/split_files/diffusion_models/${file}?download=true`,
      approxBytes,
      loaderFlag: '--diffusion-model',
    };
  }
}

module.exports = AnimaCatalogEntries;
