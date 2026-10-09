const KeyedSettings = require('./KeyedSettings');

class NvidiaSmiPathSettings extends KeyedSettings {
  static PATH_KEY = 'core.llmServer.nvidiaSmiPath';
  static HINT_DISMISSED_KEY = 'core.llmServer.nvidiaSmiPathHintDismissed';

  getSavedPath() {
    return this._db.get(NvidiaSmiPathSettings.PATH_KEY, null) || null;
  }

  setSavedPath(smiPath) {
    this._setOrDelete(NvidiaSmiPathSettings.PATH_KEY, smiPath ? String(smiPath) : null);
  }

  isHintDismissed() {
    return !!this._db.get(NvidiaSmiPathSettings.HINT_DISMISSED_KEY, false);
  }

  setHintDismissed(value) {
    this._setOrDelete(NvidiaSmiPathSettings.HINT_DISMISSED_KEY, value ? true : null);
  }
}

module.exports = NvidiaSmiPathSettings;
