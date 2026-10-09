const ImagePromptProfiles = require('../prompt/ImagePromptProfiles');

class ImageFamilyScaffold {
  static QWEN_RAPID_AIO = /qwen[-_\s]*image[-_\s]*rapid|qwen[-_\s]*rapid[-_\s]*aio|rapid[-_\s]*aio/i;

  static ANIMA_DISTILLED = /anima.*(?:8|12)[-_\s]*step|miaomiao.*8[-_\s]*step/i;

  static RAPID_AIO_RECIPE = { steps: 4, cfgScale: 1.0, sampler: 'euler_a', scheduler: 'sgm_uniform' };

  static ANIMA_DISTILLED_RECIPE = { steps: 12, cfgScale: 1.0, sampler: 'euler', scheduler: 'sgm_uniform' };

  static fromProfile(id) {
    const profile = ImagePromptProfiles.getProfile(id) || {};
    const out = {};
    if (profile.prefix) out.promptPrefix = profile.prefix;
    if (profile.negative) out.negativePrompt = profile.negative;
    if (profile.guide) out.promptGuide = profile.guide;
    return out;
  }

  static FAMILIES = {
    'qwen-image-edit': {
      steps: 4,
      cfgScale: 1.0,
      sampler: 'euler_a',
      scheduler: 'sgm_uniform',
      promptSuffix: ' sharp focus,'
        + ' keep the subject\'s identity, age, hair and body proportions consistent and on-model',
    },
    'qwen-image-2': {
      steps: 25,
      cfgScale: 1.0,
      sampler: 'euler',
      promptGuide:
        'This is Qwen-Image 2.1 (LLM-conditioned via Qwen3-VL). Write the positive '
        + 'prompt as a NATURAL-LANGUAGE description in full sentences; spell out any '
        + 'text to render inside quotes. cfg is 1.0, so negative prompts have no '
        + 'effect. When editing, describe the change as an instruction.',
    },
    anima: {
      promptPrefix: 'masterpiece, best quality, score_7, highres, ',
      negativePrompt: 'worst quality, low quality, score_1, score_2, score_3, artist name, jpeg artifacts',
    },
    sdxl: ImageFamilyScaffold.fromProfile(ImagePromptProfiles.FAMILY_FALLBACK_PROFILE.sdxl),
    'sd-1-5': ImageFamilyScaffold.fromProfile(ImagePromptProfiles.FAMILY_FALLBACK_PROFILE['sd-1-5']),
  };

  static merge(model) {
    const own = (model && model.defaults) || {};
    const family = model && model.family && ImageFamilyScaffold.FAMILIES[model.family];
    const out = Object.assign({}, family || {}, own);
    if (ImageFamilyScaffold.isQwenRapidAio(model)) Object.assign(out, ImageFamilyScaffold.RAPID_AIO_RECIPE);
    if (ImageFamilyScaffold.isAnimaDistilled(model)) Object.assign(out, ImageFamilyScaffold.ANIMA_DISTILLED_RECIPE);
    return out;
  }

  static isQwenRapidAio(model) {
    if (!model || model.family !== 'qwen-image-edit') return false;
    return ImageFamilyScaffold.QWEN_RAPID_AIO.test(ImageFamilyScaffold._haystack(model));
  }

  static isAnimaDistilled(model) {
    if (!model || model.family !== 'anima') return false;
    return ImageFamilyScaffold.ANIMA_DISTILLED.test(ImageFamilyScaffold._haystack(model));
  }

  static buildPrompt(prompt, md) {
    let out = String(prompt || '').trim();
    const prefix = (md && md.promptPrefix) ? String(md.promptPrefix) : '';
    const suffix = (md && md.promptSuffix) ? String(md.promptSuffix) : '';
    if (prefix && !ImageFamilyScaffold._contains(out, prefix)) out = prefix + out;
    if (suffix && !ImageFamilyScaffold._contains(out, suffix)) out = out + suffix;
    return out;
  }

  static _contains(text, part) {
    return text.toLowerCase().includes(part.trim().toLowerCase());
  }

  static _haystack(model) {
    const files = model.files && typeof model.files === 'object'
      ? Object.values(model.files).map((f) => f && (f.file || f.path || f.url || '')).join(' ')
      : '';
    return [model.id, model.label, model.displayName, files].filter(Boolean).join(' ');
  }
}

module.exports = ImageFamilyScaffold;
