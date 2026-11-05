const CivitaiMetaConsensus = require('./CivitaiMetaConsensus');

class CivitaiRecipe {
  static IMAGE_SAMPLE_LIMIT = 60;

  static IMAGE_SORT = 'Most Reactions';

  static LOCKED_KEYS = Object.freeze({
    flux: ['cfgScale'],
    'qwen-image-edit': ['cfgScale', 'steps'],
    'qwen-image-2-1': ['cfgScale'],
    anima: [],
  });

  static APPLIED_KEYS = Object.freeze(['steps', 'cfgScale', 'sampler', 'scheduler', 'width', 'height', 'negativePrompt']);

  static DEFAULT_MULTIPLE = 8;

  constructor({ client = null, reader = null, sampleLimit = CivitaiRecipe.IMAGE_SAMPLE_LIMIT, nsfw = false } = {}) {
    this._client = client;
    this._reader = reader;
    this._sampleLimit = sampleLimit;
    this._nsfw = nsfw;
  }

  get nsfw() {
    return typeof this._nsfw === 'function' ? !!this._nsfw() : !!this._nsfw;
  }

  async derive({ model, version, map, entry } = {}) {
    const [images, description] = await Promise.all([this._imageConsensus(version), this._readDescription({ model, version, map })]);
    return CivitaiRecipe.merge({ images: images.value, description: description.value, map, entry, warnings: [...images.warnings, ...description.warnings] });
  }

  async _imageConsensus(version) {
    if (!this._client || !version || !version.id) return { value: null, warnings: [] };
    try {
      const page = await this._client.listImages({ modelVersionId: version.id, limit: this._sampleLimit, sort: CivitaiRecipe.IMAGE_SORT, withMeta: true, nsfw: this.nsfw ? undefined : false });
      const metas = (page.items || []).map((i) => i.meta).filter(Boolean);
      return { value: CivitaiMetaConsensus.consensus(metas), warnings: [] };
    } catch (err) {
      return { value: null, warnings: [`Could not read CivitAI sample images: ${(err && err.message) || err}`] };
    }
  }

  async _readDescription({ model, version, map }) {
    if (!this._reader || !this._reader.available) return { value: null, warnings: [] };
    try {
      const read = await this._reader.read({ model, version, map });
      return { value: read ? read.recipe : null, warnings: [] };
    } catch (err) {
      return { value: null, warnings: [`The local model could not read the CivitAI description: ${(err && err.message) || err}`] };
    }
  }

  static merge({ images = null, description = null, map = null, entry = null, warnings = [] } = {}) {
    const locked = CivitaiRecipe.LOCKED_KEYS[(map && map.baseType) || (entry && entry.baseType)] || [];
    const multiple = (entry && entry.constraints && entry.constraints.dimensionMultiple) || CivitaiRecipe.DEFAULT_MULTIPLE;
    const defaults = {};
    const sources = {};
    const notes = [...warnings];
    const layers = [['images', images && images.defaults], ['description', description]];
    for (const [source, values] of layers) {
      if (!values) continue;
      for (const key of CivitaiRecipe.APPLIED_KEYS) {
        if (values[key] === undefined || values[key] === null) continue;
        if (locked.includes(key)) continue;
        defaults[key] = values[key];
        sources[key] = source;
      }
    }
    if (sources.sampler && sources.scheduler && sources.sampler !== sources.scheduler) {
      delete defaults.scheduler;
      delete sources.scheduler;
    }
    if (defaults.width && defaults.height) {
      defaults.width = CivitaiRecipe.snap(defaults.width, multiple);
      defaults.height = CivitaiRecipe.snap(defaults.height, multiple);
    }
    if (description && description.samplerExact === false && sources.sampler === 'description') {
      notes.push(`The creator recommends "${description.samplerSource}", which sd.cpp lacks; using ${defaults.sampler}${defaults.scheduler ? ` with the ${defaults.scheduler} schedule` : ''}.`);
    } else if (images && images.samplerExact === false && sources.sampler === 'images') {
      notes.push(`Most sample images used "${images.evidence.sampler.value}", which sd.cpp lacks; using ${defaults.sampler}.`);
    }
    for (const key of Object.keys(sources)) {
      if (locked.includes(key)) delete sources[key];
    }
    return {
      defaults,
      sources,
      warnings: notes,
      images: images || null,
      description: description || null,
      promptGuideAddendum: CivitaiRecipe.promptGuideAddendum(description, entry),
    };
  }

  static promptGuideAddendum(description, entry) {
    const lines = [];
    const words = (description && description.triggerWords) || (entry && entry.civitai && entry.civitai.trainedWords) || [];
    if (words.length) lines.push(`Trigger words from the creator: ${words.join(', ')}.`);
    if (description && description.positivePrefix) lines.push(`The creator starts every prompt with: ${description.positivePrefix}`);
    if (description && description.notes) lines.push(`Creator's note: ${description.notes}`);
    return lines.length ? lines.join(' ') : null;
  }

  static apply(entry, derived, now = new Date()) {
    if (!entry || !derived) return entry;
    entry.defaults = { ...(entry.defaults || {}), ...derived.defaults };
    if (derived.promptGuideAddendum) {
      const guide = String((entry.defaults && entry.defaults.promptGuide) || '').trim();
      entry.defaults.promptGuide = guide ? `${guide}\n${derived.promptGuideAddendum}` : derived.promptGuideAddendum;
    }
    entry.civitai = {
      ...(entry.civitai || {}),
      recipe: {
        sources: derived.sources,
        warnings: derived.warnings,
        imageSamples: derived.images ? derived.images.samples : 0,
        description: derived.description || null,
        derivedAt: now.toISOString(),
      },
    };
    return entry;
  }

  static snap(value, multiple) {
    const m = Math.max(1, Number(multiple) || CivitaiRecipe.DEFAULT_MULTIPLE);
    return Math.max(m, Math.round(Number(value) / m) * m);
  }
}

module.exports = CivitaiRecipe;
