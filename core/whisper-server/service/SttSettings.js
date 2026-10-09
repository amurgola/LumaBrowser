class SttSettings {
  static MODEL_KEY = 'core.voice.stt.modelPath';
  static LANGUAGE_KEY = 'core.voice.stt.language';
  static IDLE_KEY = 'core.voice.stt.autoUnloadMs';
  static DEFAULT_IDLE_MS = 5 * 60 * 1000;
  static AUTO_LANGUAGE = 'auto';

  constructor(settingsDb) {
    this._db = settingsDb;
  }

  getModelPath() {
    return this._db.get(SttSettings.MODEL_KEY, null) || null;
  }

  setModelPath(modelPath) {
    if (modelPath) this._db.set(SttSettings.MODEL_KEY, String(modelPath));
    else if (typeof this._db.delete === 'function') this._db.delete(SttSettings.MODEL_KEY);
  }

  getLanguage() {
    return this._db.get(SttSettings.LANGUAGE_KEY, SttSettings.AUTO_LANGUAGE) || SttSettings.AUTO_LANGUAGE;
  }

  setLanguage(language) {
    this._db.set(SttSettings.LANGUAGE_KEY, String(language || SttSettings.AUTO_LANGUAGE));
  }

  getAutoUnloadMs() {
    const value = Number(this._db.get(SttSettings.IDLE_KEY, SttSettings.DEFAULT_IDLE_MS));
    return Number.isFinite(value) && value >= 0 ? value : SttSettings.DEFAULT_IDLE_MS;
  }
}

module.exports = SttSettings;
