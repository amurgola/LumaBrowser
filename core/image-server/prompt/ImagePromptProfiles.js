class ImagePromptProfiles {
  static PROFILES = {
    'sdxl-illustrious': {
      label: 'Anime - Illustrious / NoobAI (booru tags)',
      appliesTo: ['sdxl'],
      prefix: 'masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest, ',
      negative:
        'worst quality, low quality, bad quality, lowres, jpeg artifacts, '
        + 'bad anatomy, bad hands, missing fingers, extra digits, fewer digits, '
        + 'signature, watermark, username, artist name, text',
      defaults: { cfgScale: 5.0 },
      guide:
        'This is an Illustrious / NoobAI-family ANIME model. Write the positive '
        + 'prompt as COMMA-SEPARATED Danbooru tags, NOT sentences. Recommended '
        + 'tag order: subject count (e.g. "1girl", "1boy", "no humans"), then '
        + 'character "\\(series\\)" if any, then appearance (hair, eyes), clothing, '
        + 'pose/action, expression, then scene/background, then camera/framing. '
        + 'The model auto-prepends its quality tags, so do not repeat them. You may '
        + 'add ONE rating tag (safe / sensitive / nsfw / explicit) to set the tone. '
        + 'Escape parentheses inside names, e.g. "lemuen \\(arknights\\)". '
        + 'Example: "1girl, solo, long silver hair, blue eyes, red kimono, sitting, '
        + 'temple courtyard, looking at viewer, soft lighting".',
    },
    'sdxl-pony': {
      label: 'Anime - Pony Diffusion (score tags)',
      appliesTo: ['sdxl'],
      prefix: 'score_9, score_8_up, score_7_up, ',
      negative:
        'score_6, score_5, score_4, worst quality, low quality, lowres, '
        + 'bad anatomy, bad hands, missing fingers, extra digits, jpeg artifacts, '
        + 'signature, watermark, text, blurry',
      defaults: { cfgScale: 6.0 },
      guide:
        'This is a Pony Diffusion SDXL model. Write the positive prompt as '
        + 'COMMA-SEPARATED Danbooru/e621 tags, NOT sentences. The model '
        + 'auto-prepends "score_9, score_8_up, score_7_up". Add a source tag '
        + '("source_anime", "source_cartoon", "source_furry", "source_pony") and a '
        + 'rating tag ("rating_safe", "rating_questionable", "rating_explicit"). '
        + 'Then list subject, appearance, clothing, pose, expression, and setting as '
        + 'tags. Example: "source_anime, rating_safe, 1girl, solo, blue hair, '
        + 'school uniform, classroom, smiling, looking at viewer".',
    },
    'sdxl-photo': {
      label: 'Photoreal / general (natural language)',
      appliesTo: ['sdxl', 'sd-1-5'],
      prefix: '',
      negative:
        'lowres, worst quality, low quality, blurry, jpeg artifacts, deformed, '
        + 'disfigured, bad anatomy, extra limbs, mutated hands, fused fingers, '
        + 'watermark, text, signature',
      defaults: { cfgScale: 6.0 },
      guide:
        'This is a photoreal / general SDXL model. Write the positive prompt as a '
        + 'concise NATURAL-LANGUAGE description (a sentence or two), NOT booru tags. '
        + 'Include the subject, the setting, the lighting, the lens/camera, and the '
        + 'mood. Example: "A fluffy orange tabby cat sitting on a sunlit windowsill, '
        + 'warm afternoon light, shallow depth of field, photorealistic, 50mm lens".',
    },
    'sdxl-generic': {
      label: 'SDXL (generic)',
      appliesTo: ['sdxl'],
      prefix: '',
      negative:
        'lowres, worst quality, low quality, jpeg artifacts, blurry, bad anatomy, '
        + 'bad hands, extra digits, signature, watermark, text',
      guide:
        'Focus the prompt on the SUBJECT, composition and concrete details, and '
        + 'name the framing you want (e.g. "full body" vs "waist-up portrait"). If '
        + 'this is an anime / booru-style model, use comma-separated tags; if it is '
        + 'a photoreal model, write a concise natural-language description.',
    },
    'sd-1-5-generic': {
      label: 'SD 1.5 (generic)',
      appliesTo: ['sd-1-5'],
      prefix: '',
      negative:
        'lowres, worst quality, low quality, jpeg artifacts, blurry, bad anatomy, '
        + 'bad hands, extra digits, signature, watermark, text, cropped',
      guide:
        'This is an SD 1.5 model: it prefers SHORTER prompts than SDXL and a base '
        + 'resolution near 512. Focus on the subject, a few strong descriptors, and '
        + 'the framing. Booru-tag fine-tunes take comma-separated tags; others take '
        + 'a short natural-language description.',
    },
  };

  static DEFAULT_PROFILE_BY_BASE = {
    'sdxl': 'sdxl-generic',
    'sd-1-5': 'sd-1-5-generic',
  };

  static FAMILY_FALLBACK_PROFILE = {
    'sdxl': 'sdxl-generic',
    'sd-1-5': 'sd-1-5-generic',
  };

  static getProfile(id) {
    return (id && ImagePromptProfiles.PROFILES[id]) || null;
  }

  static profilesForBase(baseType) {
    return Object.entries(ImagePromptProfiles.PROFILES)
      .filter(([, profile]) => Array.isArray(profile.appliesTo) && profile.appliesTo.includes(baseType))
      .map(([id, profile]) => ({ id, label: profile.label }));
  }

  static profileDefaultsPatch(id) {
    const profile = ImagePromptProfiles.getProfile(id);
    if (!profile) return {};
    const patch = { ...(profile.defaults || {}) };
    if (profile.prefix) patch.promptPrefix = profile.prefix;
    if (profile.negative) patch.negativePrompt = profile.negative;
    if (profile.guide) patch.promptGuide = profile.guide;
    return patch;
  }
}

module.exports = ImagePromptProfiles;
