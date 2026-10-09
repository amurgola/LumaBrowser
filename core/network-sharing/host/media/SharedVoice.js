const VoiceViews = require('./VoiceViews');
const VoiceAudioInput = require('./VoiceAudioInput');

class SharedVoice {
  static SETUP_CODES = new Set(['NO_STT_MODEL', 'STT_RUNTIME_MISSING', 'NO_TTS_MODEL', 'TTS_RUNTIME_MISSING']);

  constructor(service) {
    this._service = service;
  }

  engines() {
    const voice = typeof this._service.getVoiceServices === 'function' ? this._service.getVoiceServices() : null;
    return voice && (voice.stt || voice.tts) ? voice : null;
  }

  gate() {
    if (!this._isShared()) return SharedVoice._refusal(403, 'voice is not shared', 'VOICE_NOT_SHARED');
    if (!this.engines()) return SharedVoice._refusal(503, 'host has no voice engines', 'VOICE_UNAVAILABLE');
    return null;
  }

  status() {
    const voice = this.engines();
    const shared = this._isShared() && !!voice;
    return {
      success: true,
      shared,
      stt: shared ? VoiceViews.stt(voice.stt) : VoiceViews.notSharedStt(),
      tts: shared ? VoiceViews.tts(voice.tts) : VoiceViews.notSharedTts(),
    };
  }

  async prewarm() {
    const voice = this.engines();
    const [stt, tts] = await Promise.all([SharedVoice._warm(voice.stt), SharedVoice._warm(voice.tts)]);
    return { success: true, stt, tts };
  }

  async transcribe(req) {
    const stt = this.engines().stt;
    if (!stt || typeof stt.transcribe !== 'function') return SharedVoice._refusal(503, 'host has no speech-to-text engine', 'VOICE_UNAVAILABLE');
    const { wav, language } = VoiceAudioInput.read(req);
    if (!VoiceAudioInput.isUsable(wav)) return { status: 400, body: { success: false, error: 'audio is required (audio/wav body or { wav: base64 })' } };
    try {
      const result = await stt.transcribe(wav, { language });
      return { status: 200, body: { success: true, text: result && result.text ? result.text : '', durationMs: result && result.durationMs } };
    } catch (err) {
      return { status: SharedVoice.errorStatus(err), body: { success: false, error: err.message, code: err.code || null } };
    }
  }

  synthesisRefusal(text) {
    const tts = this.engines().tts;
    if (!tts || typeof tts.synthesize !== 'function') return SharedVoice._refusal(503, 'host has no text-to-speech engine', 'VOICE_UNAVAILABLE');
    if (!text) return { status: 400, body: { success: false, error: 'text is required' } };
    const view = VoiceViews.tts(tts);
    if (!view.runtimeReady) return SharedVoice._refusal(503, 'The text-to-speech runtime is not installed on the host yet.', 'TTS_RUNTIME_MISSING');
    if (!view.models.length) return SharedVoice._refusal(503, 'No voice installed on the host.', 'NO_TTS_MODEL');
    return null;
  }

  static errorStatus(err) {
    return err && SharedVoice.SETUP_CODES.has(err.code) ? 503 : 500;
  }

  _isShared() {
    let flags = {};
    try {
      flags = this._service.getShareFlags() || {};
    } catch (_) {}
    return flags.shareVoice !== false;
  }

  static async _warm(engine) {
    if (!engine || typeof engine.ensureRunning !== 'function') return { ok: false, code: 'VOICE_UNAVAILABLE' };
    try {
      await engine.ensureRunning();
      return { ok: true };
    } catch (err) {
      return { ok: false, code: err.code || null, error: err.message };
    }
  }

  static _refusal(status, error, code) {
    return { status, body: { success: false, error, code } };
  }
}

module.exports = SharedVoice;
