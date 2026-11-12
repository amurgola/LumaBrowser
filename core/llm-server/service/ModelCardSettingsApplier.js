const ModelCardSettings = require('../models/ModelCardSettings');
const ModelSettings = require('./ModelSettings');

class ModelCardSettingsApplier {
  constructor({ modelSettings, find = (repoId, opts) => ModelCardSettings.find(repoId, opts) } = {}) {
    this._settings = modelSettings;
    this._find = find;
  }

  async apply({ repoId, filePath = null, modelRef = null, signal = null } = {}) {
    try {
      const ref = modelRef || (filePath ? ModelSettings.localRef(filePath) : null);
      const settings = typeof this._settings === 'function' ? this._settings() : this._settings;
      if (!repoId || !ref || !settings) return { found: false };
      const hit = await this._find(repoId, { signal });
      if (!hit) return { found: false, modelRef: ref };
      const { applied, kept } = settings.applySuggested(ref, hit.settings, hit.text);
      return { found: true, applied, kept, source: hit.text, sourceRepo: hit.source.repoId, modelRef: ref };
    } catch (err) {
      return { found: false, error: (err && err.message) || String(err) };
    }
  }
}

module.exports = ModelCardSettingsApplier;
