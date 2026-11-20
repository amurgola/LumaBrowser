class LoraApplier {
  static DEFAULT_WEIGHT = 1.0;
  static WEIGHT = { min: 0.05, max: 2 };
  static PRESET_KEYS = ['steps', 'cfgScale', 'sampler', 'scheduler', 'sigmaNodes', 'highNoiseSteps', 'highNoiseCfgScale'];

  constructor({ host, models }) {
    this._host = host;
    this._models = models;
  }

  async apply({ loraName, modelRef = null, weight = null, remove = false }) {
    const lora = this._lora(loraName);
    const model = await this._target(lora, modelRef);
    this._assertFits(lora, model);
    const entry = { name: lora.name, weight: LoraApplier.weight(weight) };
    const loras = LoraApplier.merged(model.defaults && model.defaults.loras, entry, remove);
    await this._host.setModelLoras(model.id, loras, LoraApplier.presetOf(model.defaults));
    return {
      lora: lora.name,
      model: { id: model.id, label: model.label || model.id },
      weight: entry.weight,
      trigger: lora.trigger || (lora.trained && lora.trained.trigger) || null,
      attached: !remove,
    };
  }

  _lora(name) {
    const wanted = String(name || '').trim().replace(/\.safetensors$/i, '').toLowerCase();
    if (!wanted) throw new Error('apply_lora needs the "lora" name.');
    const loras = this._host.listLoras();
    const lora = loras.find((entry) => entry.name.toLowerCase() === wanted);
    if (!lora) throw new Error(`No LoRA named "${name}" is in the library. Library: ${loras.map((l) => l.name).join(', ') || 'empty'}.`);
    return lora;
  }

  async _target(lora, modelRef) {
    if (modelRef) return this._models.find(modelRef);
    const trainedFor = lora.trained && lora.trained.trainedFor;
    if (trainedFor) {
      try { return await this._models.find(trainedFor); } catch (_) {}
    }
    return this._models.find(null);
  }

  _assertFits(lora, model) {
    const label = model.label || model.id;
    const recipeId = lora.trained && lora.trained.recipeId;
    if (recipeId) {
      const recipe = this._models.recipeOf(model);
      if (!recipe || recipe.id !== recipeId) {
        throw new Error(`"${lora.name}" was trained for the ${recipeId} family and does not fit "${label}" (${model.family || 'unknown family'}).`);
      }
      return;
    }
    const families = lora.families || [];
    if (families.length && !families.includes(model.family)) {
      throw new Error(`"${lora.name}" is a ${lora.base && lora.base.label ? lora.base.label : families.join('/')} LoRA and does not fit "${label}" (${model.family || 'unknown family'}).`);
    }
  }

  static presetOf(defaults) {
    if (!defaults || !defaults.distilledPreset) return null;
    const preset = {};
    for (const key of LoraApplier.PRESET_KEYS) if (defaults[key] !== undefined) preset[key] = defaults[key];
    return preset;
  }

  static merged(current, entry, remove) {
    const others = (Array.isArray(current) ? current : []).filter((lora) => lora && lora.name !== entry.name);
    return remove ? others : [...others, entry];
  }

  static weight(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return LoraApplier.DEFAULT_WEIGHT;
    return Math.min(LoraApplier.WEIGHT.max, Math.max(LoraApplier.WEIGHT.min, number));
  }
}

module.exports = LoraApplier;
