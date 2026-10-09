class TtsVoiceSettings {
  static MODEL_KEY = 'core.voice.tts.modelId';
  static SID_KEY = 'core.voice.tts.sid';
  static SPEED_KEY = 'core.voice.tts.speed';
  static IDLE_KEY = 'core.voice.tts.autoUnloadMs';
  static DEFAULT_IDLE_MS = 5 * 60 * 1000;
  static MIN_SPEED = 0.25;
  static MAX_SPEED = 4;

  constructor(settingsDb) {
    this._db = settingsDb;
  }

  getModelId() {
    return this._db.get(TtsVoiceSettings.MODEL_KEY, null) || null;
  }

  setModelId(id) {
    this._db.set(TtsVoiceSettings.MODEL_KEY, String(id || ''));
  }

  getSid() {
    const value = Number(this._db.get(TtsVoiceSettings.SID_KEY, 0));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  setSid(sid) {
    this._db.set(TtsVoiceSettings.SID_KEY, Number(sid) || 0);
  }

  getSpeed() {
    const value = Number(this._db.get(TtsVoiceSettings.SPEED_KEY, 1));
    return Number.isFinite(value) && value > TtsVoiceSettings.MIN_SPEED && value < TtsVoiceSettings.MAX_SPEED ? value : 1;
  }

  setSpeed(speed) {
    this._db.set(TtsVoiceSettings.SPEED_KEY, Number(speed) || 1);
  }

  getAutoUnloadMs() {
    const value = Number(this._db.get(TtsVoiceSettings.IDLE_KEY, TtsVoiceSettings.DEFAULT_IDLE_MS));
    return Number.isFinite(value) && value >= 0 ? value : TtsVoiceSettings.DEFAULT_IDLE_MS;
  }
}

module.exports = TtsVoiceSettings;
