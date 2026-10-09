class VoiceReadiness {
  constructor({ stt, tts }) {
    this._stt = stt;
    this._tts = tts;
    this._sttReady = false;
    this._pending = null;
  }

  static isReady(view) {
    return Boolean(view && view.runtimeReady && view.models && view.models.length);
  }

  sttReady() {
    this.refreshStt();
    return this._sttReady;
  }

  ttsReady() {
    return VoiceReadiness.isReady(this._tts.getView());
  }

  refreshStt() {
    if (!this._pending) this._pending = this._readStt().finally(() => { this._pending = null; });
    return this._pending;
  }

  async _readStt() {
    try {
      this._sttReady = VoiceReadiness.isReady(await this._stt.getView());
    } catch (_) {
      this._sttReady = false;
    }
    return this._sttReady;
  }
}

module.exports = VoiceReadiness;
