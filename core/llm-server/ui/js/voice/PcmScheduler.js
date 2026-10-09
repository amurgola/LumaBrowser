export default class PcmScheduler {
  static DEFAULT_RATE = 24000;
  static LEAD_S = 0.15;
  static EDGE_FADE_S = 0.004;
  static SENTENCE_GAP_S = 0.12;

  constructor(AudioContextClass = null) {
    this._AudioContext = AudioContextClass;
    this.context = null;
    this._live = new Set();
    this.resetSchedule();
  }

  get liveCount() {
    return this._live.size;
  }

  ensureContext(rate) {
    const want = rate || PcmScheduler.DEFAULT_RATE;
    if (this.context && this.context.sampleRate !== want && this._live.size === 0) this.close();
    if (!this.context) {
      const AudioContextClass = this._AudioContext || window.AudioContext;
      this.context = new AudioContextClass({ sampleRate: want });
      this._playAt = 0;
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    return this.context;
  }

  schedule(requestId, payload, onEnded) {
    const bytes = payload && payload.pcm;
    if (!bytes || !bytes.byteLength) return false;
    const rate = payload.sampleRate || PcmScheduler.DEFAULT_RATE;
    const ctx = this.ensureContext(payload.sampleRate);
    const buffer = ctx.createBuffer(1, Math.floor(bytes.byteLength / 2), rate);
    buffer.copyToChannel(PcmScheduler._toFloat(bytes), 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    const startAt = this._startTime(ctx, requestId);
    PcmScheduler._ramp(gain.gain, startAt, buffer.duration);
    source.start(startAt);
    this._playAt = startAt + buffer.duration;
    this._live.add(source);
    source.onended = () => { this._live.delete(source); onEnded(); };
    return true;
  }

  stop() {
    for (const source of this._live) { try { source.stop(); } catch (_) {} }
    this._live.clear();
    this.resetSchedule();
  }

  resetSchedule() {
    this._playAt = 0;
    this._lastRequest = null;
  }

  close() {
    if (!this.context) return;
    try { this.context.close(); } catch (_) {}
    this.context = null;
  }

  _startTime(ctx, requestId) {
    if (this._lastRequest !== null && requestId !== this._lastRequest) this._playAt += PcmScheduler.SENTENCE_GAP_S;
    this._lastRequest = requestId;
    return Math.max(ctx.currentTime + PcmScheduler.LEAD_S, this._playAt);
  }

  static _ramp(param, startAt, duration) {
    const fade = Math.min(PcmScheduler.EDGE_FADE_S, duration / 4);
    param.setValueAtTime(0, startAt);
    param.linearRampToValueAtTime(1, startAt + fade);
    param.setValueAtTime(1, startAt + duration - fade);
    param.linearRampToValueAtTime(0, startAt + duration);
  }

  static _toFloat(bytes) {
    const i16 = new Int16Array(bytes.buffer || bytes, bytes.byteOffset || 0, Math.floor(bytes.byteLength / 2));
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
    return f32;
  }
}
