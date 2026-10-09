export default class PcmPlayer {
  static DEFAULT_RATE = 24000;
  static LEAD_S = 0.15;
  static EDGE_FADE_S = 0.004;
  static SENTENCE_GAP_S = 0.12;

  constructor(AudioContextClass, onEnded) {
    this._AudioContext = AudioContextClass;
    this._onEnded = onEnded;
    this._ctx = null;
    this._playAt = 0;
    this._lastRequest = null;
    this._sources = new Set();
  }

  get activeCount() {
    return this._sources.size;
  }

  schedule(requestId, payload) {
    const bytes = payload && payload.pcm;
    if (!bytes || !bytes.byteLength) return false;
    const rate = payload.sampleRate || PcmPlayer.DEFAULT_RATE;
    const ctx = this._ensureContext(payload.sampleRate);
    const buf = ctx.createBuffer(1, Math.floor(bytes.byteLength / 2), rate);
    buf.copyToChannel(PcmPlayer.toFloat32(bytes), 0);
    this._start(ctx, buf, requestId);
    return true;
  }

  stop() {
    for (const src of this._sources) { try { src.stop(); } catch (_) {} }
    this._sources.clear();
    this._playAt = 0;
    this._lastRequest = null;
  }

  static toFloat32(bytes) {
    const i16 = new Int16Array(bytes.buffer || bytes, bytes.byteOffset || 0, Math.floor(bytes.byteLength / 2));
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
    return f32;
  }

  _ensureContext(rate) {
    const want = rate || PcmPlayer.DEFAULT_RATE;
    if (this._ctx && this._ctx.sampleRate !== want && this._sources.size === 0) {
      try { this._ctx.close(); } catch (_) {}
      this._ctx = null;
    }
    if (!this._ctx) {
      this._ctx = new this._AudioContext({ sampleRate: want });
      this._playAt = 0;
    }
    if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
    return this._ctx;
  }

  _start(ctx, buf, requestId) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    src.connect(gain);
    gain.connect(ctx.destination);
    if (this._lastRequest !== null && requestId !== this._lastRequest) this._playAt += PcmPlayer.SENTENCE_GAP_S;
    this._lastRequest = requestId;
    const startAt = Math.max(ctx.currentTime + PcmPlayer.LEAD_S, this._playAt);
    PcmPlayer._fadeEdges(gain.gain, startAt, buf.duration);
    src.start(startAt);
    this._playAt = startAt + buf.duration;
    this._sources.add(src);
    src.onended = () => {
      this._sources.delete(src);
      this._onEnded();
    };
  }

  static _fadeEdges(param, startAt, duration) {
    const fade = Math.min(PcmPlayer.EDGE_FADE_S, duration / 4);
    param.setValueAtTime(0, startAt);
    param.linearRampToValueAtTime(1, startAt + fade);
    param.setValueAtTime(1, startAt + duration - fade);
    param.linearRampToValueAtTime(0, startAt + duration);
  }
}
