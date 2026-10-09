class ImageProfiles {
  static IDS = ['fast', 'balanced', 'quality'];
  static DEFAULT_ID = 'balanced';

  static PROFILES = Object.freeze({
    fast: ImageProfiles._freeze({
      id: 'fast', editSteps: 4, figureSteps: 4, outfitSteps: 4, emotionSteps: 4,
      harmonize: false, harmonizeStrength: 0, auditLimit: 1, retryAttempts: 2, retryDelayMs: 800,
      resolutions: {
        portrait: { width: 448, height: 448 },
        scene: { width: 640, height: 448 },
        composite: { width: 768, height: 1152 },
        reaction: { width: 640, height: 896 },
        reactionFull: { width: 672, height: 960 },
      },
    }),
    balanced: ImageProfiles._freeze({
      id: 'balanced', editSteps: 6, figureSteps: 4, outfitSteps: 6, emotionSteps: 6,
      harmonize: false, harmonizeStrength: 0, auditLimit: 1, retryAttempts: 3, retryDelayMs: 1500,
      resolutions: {
        portrait: { width: 512, height: 512 },
        scene: { width: 768, height: 512 },
        composite: { width: 768, height: 1152 },
        reaction: { width: 768, height: 1024 },
        reactionFull: { width: 832, height: 1216 },
      },
    }),
    quality: ImageProfiles._freeze({
      id: 'quality', editSteps: 8, figureSteps: 6, outfitSteps: 8, emotionSteps: 8,
      harmonize: true, harmonizeStrength: 0.07, auditLimit: 2, retryAttempts: 3, retryDelayMs: 2500,
      resolutions: {
        portrait: { width: 512, height: 512 },
        scene: { width: 896, height: 640 },
        composite: { width: 768, height: 1152 },
        reaction: { width: 768, height: 1024 },
        reactionFull: { width: 832, height: 1216 },
      },
    }),
  });

  static idFor(data) {
    const id = String((data && data.options && data.options.imageProfile) || '').trim().toLowerCase();
    return ImageProfiles.IDS.includes(id) ? id : ImageProfiles.DEFAULT_ID;
  }

  static resolve(data, env = process.env || {}) {
    const base = ImageProfiles.PROFILES[ImageProfiles.idFor(data)];
    const options = (data && data.options) || {};
    return {
      ...base,
      editSteps: ImageProfiles._positiveInt(env.RP_EDIT_STEPS, base.editSteps),
      sampler: String(env.RP_SAMPLER || 'euler_a').trim(),
      scheduler: String(env.RP_SCHEDULER || 'sgm_uniform').trim(),
      cfgScale: ImageProfiles._positiveNumber(env.RP_CFG, 1),
      harmonize: ImageProfiles._harmonize(options, base),
      harmonizeStrength: ImageProfiles._harmonizeStrength(options, env, base),
      harmonizeSteps: ImageProfiles._positiveInt(env.RP_HARMONIZE_STEPS || options.harmonizeSteps, base.editSteps),
    };
  }

  static editRecipe(data, stepKey = 'editSteps') {
    const profile = ImageProfiles.resolve(data);
    return {
      steps: profile[stepKey] || profile.editSteps,
      sampler: profile.sampler,
      scheduler: profile.scheduler,
      cfgScale: profile.cfgScale,
    };
  }

  static dimensionsFor(data, type, fallbackWidth, fallbackHeight) {
    const defaults = ImageProfiles.resolve(data).resolutions[type] || {};
    const custom = (data && data.options && data.options.resolutions && data.options.resolutions[type]) || {};
    return {
      width: ImageProfiles._positiveInt(custom.width, ImageProfiles._positiveInt(defaults.width, fallbackWidth)),
      height: ImageProfiles._positiveInt(custom.height, ImageProfiles._positiveInt(defaults.height, fallbackHeight)),
    };
  }

  static baseModelRecipe(data) {
    const profile = ImageProfiles.resolve(data);
    const model = String((data && data.baseModel) || '').toLowerCase();
    if (/animatwo|miaomiao|8[\s_-]*step/.test(model)) {
      const steps = profile.id === 'fast' ? 8 : (profile.id === 'quality' ? 20 : 12);
      return { steps, cfgScale: 1, sampler: 'euler', scheduler: 'sgm_uniform' };
    }
    if (/anima/.test(model)) {
      const steps = profile.id === 'fast' ? 24 : (profile.id === 'quality' ? 40 : 30);
      return { steps, cfgScale: 4.5, sampler: 'er_sde', scheduler: 'sgm_uniform' };
    }
    return {};
  }

  static renderConfigRevision(data) {
    const profile = ImageProfiles.resolve(data);
    const options = (data && data.options) || {};
    return JSON.stringify({
      profile: profile.id,
      baseModel: (data && data.baseModel) || null,
      editModel: (data && data.editModel) || null,
      style: (data && data.style) || '',
      resolutions: options.resolutions || null,
      harmonize: profile.harmonize,
      harmonizeStrength: profile.harmonizeStrength,
      harmonizeSteps: profile.harmonizeSteps,
      artRevision: Number(options.artRevision) || 0,
    });
  }

  static _harmonize(options, base) {
    if (options.harmonizeMode === 'on') return true;
    if (options.harmonizeMode === 'off') return false;
    if (options.harmonizeMode === 'auto') return base.harmonize;
    return options.harmonize === undefined ? base.harmonize : options.harmonize !== false;
  }

  static _harmonizeStrength(options, env, base) {
    const envStrength = Number.parseFloat(env.RP_HARMONIZE_STRENGTH);
    if (Number.isFinite(envStrength)) return envStrength;
    const optionStrength = Number(options.harmonizeStrength);
    return Number.isFinite(optionStrength) ? optionStrength : base.harmonizeStrength;
  }

  static _positiveInt(value, fallback) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  static _positiveNumber(value, fallback) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  static _freeze(profile) {
    const resolutions = {};
    for (const [type, size] of Object.entries(profile.resolutions)) resolutions[type] = Object.freeze(size);
    return Object.freeze({ ...profile, resolutions: Object.freeze(resolutions) });
  }
}

module.exports = ImageProfiles;
