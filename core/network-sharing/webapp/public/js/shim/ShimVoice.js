export default class ShimVoice {
  static HOST_ONLY = { success: false, error: 'Voice is set up on the host computer, not from a remote device.', code: 'HOST_ONLY' };
  static STT_SETUP = ['installRuntime', 'downloadModel', 'cancelDownload', 'setDefaultModel', 'setLanguage', 'stop'];
  static TTS_SETUP = ['installRuntime', 'downloadModel', 'cancelDownload', 'setDefaults', 'stop'];

  constructor(api) {
    this._api = api;
    this._ttsListeners = new Set();
    this._inFlight = new Map();
  }

  surface() {
    return {
      remote: true,
      transcribe: (wav, opts) => this.transcribe(wav, opts),
      synthesize: (args) => this.synthesize(args),
      synthesizeAbort: (requestId) => this.synthesizeAbort(requestId),
      onTtsEvent: (cb) => this.onTtsEvent(cb),
      onVoiceEvent: () => () => {},
      stt: this._half('stt', ShimVoice.STT_SETUP),
      tts: this._half('tts', ShimVoice.TTS_SETUP),
    };
  }

  async transcribe(wav, opts) {
    try {
      return await this._api.voiceTranscribe(wav, opts);
    } catch (e) {
      return { success: false, error: (e && e.message) || 'transcription failed' };
    }
  }

  async synthesize(args) {
    const requestId = String((args && args.requestId) || ('tts-' + Date.now()));
    const ac = new AbortController();
    this._inFlight.set(requestId, ac);
    const r = await this._stream(args, requestId, ac);
    this._inFlight.delete(requestId);
    if (r && r.success === false && !ac.signal.aborted) {
      return { success: false, error: r.error, code: r.code || null, requestId };
    }
    this._emit({
      requestId,
      type: r && r.success === false ? 'error' : 'done',
      payload: { canceled: !!(r && r.canceled) || ac.signal.aborted, message: r && r.error },
    });
    return { success: true, requestId };
  }

  async synthesizeAbort(requestId) {
    const ac = this._inFlight.get(String(requestId));
    if (ac) ac.abort();
    return { success: true, found: !!ac };
  }

  onTtsEvent(cb) {
    this._ttsListeners.add(cb);
    return () => this._ttsListeners.delete(cb);
  }

  async view(half) {
    try {
      const s = await this._api.voiceStatus();
      return { success: true, shared: s && s.shared !== false, ...((s && s[half]) || {}) };
    } catch (e) {
      return { success: false, error: (e && e.message) || 'voice status failed' };
    }
  }

  async _stream(args, requestId, ac) {
    try {
      return await this._api.voiceSynthesize({
        text: String((args && args.text) || ''), sid: args && args.sid, speed: args && args.speed, signal: ac.signal,
        onChunk: (chunk) => this._emit({ requestId, type: 'chunk', payload: chunk }),
      });
    } catch (e) {
      return { success: false, error: ac.signal.aborted ? 'aborted' : ((e && e.message) || 'synthesis failed') };
    }
  }

  _half(name, setupActions) {
    const half = {
      getView: () => this.view(name),
      prewarm: () => this._api.voicePrewarm().catch(() => ({ success: false })),
    };
    for (const action of setupActions) half[action] = () => Promise.resolve({ ...ShimVoice.HOST_ONLY });
    return half;
  }

  _emit(event) {
    for (const cb of this._ttsListeners) {
      try {
        cb(event);
      } catch (_) {}
    }
  }
}
