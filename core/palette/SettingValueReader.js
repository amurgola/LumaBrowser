const SettingValueSpecs = require('./catalog/SettingValueSpecs');
const SettingValueText = require('./SettingValueText');

class SettingValueReader {
  constructor({ settingsDb, specs = SettingValueSpecs, runtimeName = null }) {
    this._db = settingsDb;
    this._specs = specs;
    this._runtimeName = runtimeName || SettingValueReader.runtimeName;
  }

  valueOf(entry) {
    if (!entry || !entry.key || !this._db) return null;
    const spec = this._specs[entry.id];
    if (!spec) return null;
    try {
      return SettingValueText.text(spec, this._db.get(entry.key, null), { runtime: this._runtimeName });
    } catch (_) {
      return null;
    }
  }

  static runtimeName(id) {
    try {
      const llm = require('../llm-server/runtimes/LlmRuntimeCatalog').shared.getById(id);
      if (llm && llm.name) return llm.name;
    } catch (_) {}
    try {
      const ImageRuntimeCatalog = require('../image-server/runtimes/ImageRuntimeCatalog');
      const img = ImageRuntimeCatalog.RUNTIMES.find((r) => r.id === id);
      if (img && img.name) return img.name;
    } catch (_) {}
    return null;
  }
}

module.exports = SettingValueReader;
