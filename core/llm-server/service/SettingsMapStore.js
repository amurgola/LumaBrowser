const SettingsValueStore = require('../../database/SettingsValueStore');

class SettingsMapStore extends SettingsValueStore {
  all() {
    return { ...this._read() };
  }

  _emptyValue() {
    return {};
  }

  _hasValidShape(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}

module.exports = SettingsMapStore;
