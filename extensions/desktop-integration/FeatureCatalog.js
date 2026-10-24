const fs = require('fs');
const path = require('path');
const FeatureSettingsSchema = require('./FeatureSettingsSchema');

class FeatureCatalog {
  static ENTRY = 'index.js';
  static ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
  static RESERVED_IDS = new Set(['hello']);

  static discover(dir, { load = (file) => require(file) } = {}) {
    const loaded = [];
    const failed = [];
    const seen = new Set();
    for (const folder of FeatureCatalog._folders(dir)) {
      try {
        const mod = FeatureCatalog.validate(load(path.join(dir, folder, FeatureCatalog.ENTRY)), folder);
        if (seen.has(mod.id)) throw new Error(`Duplicate feature id "${mod.id}"`);
        seen.add(mod.id);
        loaded.push(mod);
      } catch (err) {
        failed.push({ folder, error: (err && err.message) || String(err) });
      }
    }
    return { loaded: loaded.sort((a, b) => a.id.localeCompare(b.id)), failed };
  }

  static validate(mod, folder) {
    if (!mod || typeof mod !== 'object') throw new Error('index.js must export an object');
    const id = String(mod.id || '');
    if (!FeatureCatalog.ID_PATTERN.test(id)) throw new Error(`Invalid feature id "${id}" (lowercase letters, digits, dashes)`);
    if (id !== folder) throw new Error(`Feature id "${id}" must match its folder "${folder}"`);
    if (FeatureCatalog.RESERVED_IDS.has(id)) throw new Error(`Feature id "${id}" is reserved`);
    if (typeof mod.create !== 'function') throw new Error('create(deps) must be a function');
    return {
      id,
      label: String(mod.label || id),
      description: String(mod.description || ''),
      defaultEnabled: mod.defaultEnabled !== false,
      settingsSchema: FeatureSettingsSchema.normalize(mod.settingsSchema),
      create: mod.create,
    };
  }

  static _folders(dir) {
    try {
      return fs.readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('_'))
        .filter((entry) => fs.existsSync(path.join(dir, entry.name, FeatureCatalog.ENTRY)))
        .map((entry) => entry.name)
        .sort();
    } catch (_) {
      return [];
    }
  }
}

module.exports = FeatureCatalog;
