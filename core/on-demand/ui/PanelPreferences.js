export default class PanelPreferences {
  static SPEAK_KEY = 'od.speak';
  static AUTO_VOICE_KEY = 'od.autoVoice';

  constructor(storage) {
    this._storage = storage;
    this.speak = storage.getItem(PanelPreferences.SPEAK_KEY) !== '0';
    this.autoVoice = storage.getItem(PanelPreferences.AUTO_VOICE_KEY) !== '0';
  }

  setSpeak(on) {
    this.speak = !!on;
    this._storage.setItem(PanelPreferences.SPEAK_KEY, this.speak ? '1' : '0');
  }

  setAutoVoice(on) {
    this.autoVoice = !!on;
    this._storage.setItem(PanelPreferences.AUTO_VOICE_KEY, this.autoVoice ? '1' : '0');
  }
}
