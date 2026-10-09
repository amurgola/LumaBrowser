class LoraPresetRecipe {
  static RECIPE_KEYS = Object.freeze(['steps', 'cfgScale', 'sampler', 'scheduler', 'sigmaNodes', 'highNoiseSteps', 'highNoiseCfgScale']);

  static FALLBACK = Object.freeze({ steps: 8, cfgScale: 1.0, sampler: 'euler' });

  static cleanLoras(loras) {
    if (!Array.isArray(loras)) return [];
    return loras
      .filter((l) => l && l.name)
      .map((l) => ({
        name: String(l.name),
        weight: (typeof l.weight === 'number' && l.weight > 0) ? l.weight : 1.0,
        ...(l.highNoise ? { highNoise: true } : {}),
      }));
  }

  static curatedPreset(loras, loraCatalog) {
    for (const lora of loras) {
      const entry = loraCatalog.list().find((c) => loraCatalog.entryFiles(c)
        .some((f) => String(f.file || '').replace(/\.[^.]+$/, '') === lora.name));
      if (entry && entry.preset) return entry.preset;
    }
    return null;
  }

  static apply(defaults, preset) {
    const p = preset || {};
    if (!defaults.recipeBeforePreset) defaults.recipeBeforePreset = LoraPresetRecipe._snapshot(defaults);
    LoraPresetRecipe._setOrDelete(defaults, 'sigmaNodes', Array.isArray(p.sigmaNodes) && p.sigmaNodes.length ? p.sigmaNodes.map(Number) : undefined);
    defaults.steps = Number(p.steps) > 0 ? Math.floor(Number(p.steps)) : LoraPresetRecipe.FALLBACK.steps;
    defaults.cfgScale = typeof p.cfgScale === 'number' ? p.cfgScale : LoraPresetRecipe.FALLBACK.cfgScale;
    defaults.sampler = p.sampler || LoraPresetRecipe.FALLBACK.sampler;
    LoraPresetRecipe._setOrDelete(defaults, 'highNoiseSteps', Number(p.highNoiseSteps) > 0 ? Math.floor(Number(p.highNoiseSteps)) : undefined);
    LoraPresetRecipe._setOrDelete(defaults, 'highNoiseCfgScale', typeof p.highNoiseCfgScale === 'number' ? p.highNoiseCfgScale : undefined);
    defaults.distilledPreset = true;
    return defaults;
  }

  static remove(defaults) {
    if (defaults.distilledPreset) LoraPresetRecipe._restore(defaults);
    delete defaults.distilledPreset;
    return defaults;
  }

  static _restore(defaults) {
    const prev = defaults.recipeBeforePreset;
    if (!prev || typeof prev !== 'object') return;
    for (const key of LoraPresetRecipe.RECIPE_KEYS) LoraPresetRecipe._setOrDelete(defaults, key, prev[key]);
    delete defaults.recipeBeforePreset;
  }

  static _snapshot(defaults) {
    const prev = {};
    for (const key of LoraPresetRecipe.RECIPE_KEYS) if (defaults[key] !== undefined) prev[key] = defaults[key];
    return prev;
  }

  static _setOrDelete(target, key, value) {
    if (value === undefined) delete target[key];
    else target[key] = value;
  }
}

module.exports = LoraPresetRecipe;
