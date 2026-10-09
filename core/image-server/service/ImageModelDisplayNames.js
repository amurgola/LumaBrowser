const SettingsValueStore = require('../../database/SettingsValueStore');
const ImageModelName = require('../models/ImageModelName');

class ImageModelDisplayNames extends SettingsValueStore {
  static STORAGE_KEY = 'core.imageServer.modelDisplayNames';

  constructor(settingsDb) {
    super(settingsDb, ImageModelDisplayNames.STORAGE_KEY);
  }

  all() {
    return { ...this._read() };
  }

  set(key, name) {
    if (!key) return this.all();
    const names = this.all();
    const clean = typeof name === 'string' ? name.trim() : '';
    if (clean) names[key] = clean;
    else delete names[key];
    this._write(names);
    return names;
  }

  resolve(stem) {
    return ImageModelName.resolveDisplayName({ stem, overrides: this.all() });
  }

  _emptyValue() {
    return {};
  }

  _hasValidShape(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}

module.exports = ImageModelDisplayNames;
