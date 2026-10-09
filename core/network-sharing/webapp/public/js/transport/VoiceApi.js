import StreamFrames from './StreamFrames.js';

export default class VoiceApi {
  static DEFAULT_SAMPLE_RATE = 24000;

  constructor(http) {
    this._http = http;
  }

  async status() {
    const res = await this._http.authed('/sharing/voice/status', { cache: 'no-store' });
    this._http.throwIfUnauthorized(res);
    if (!res.ok) throw new Error('Voice status unavailable');
    return res.json();
  }

  async prewarm() {
    const res = await this._http.authed('/sharing/voice/prewarm', { method: 'POST' });
    this._http.throwIfUnauthorized(res);
    return res.json().catch(() => ({ success: false }));
  }

  async transcribe(wav, opts) {
    const query = opts && opts.language ? '?language=' + encodeURIComponent(opts.language) : '';
    const res = await this._http.authed('/sharing/voice/transcribe' + query, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav' },
      body: wav,
    });
    this._http.throwIfUnauthorized(res);
    const body = await res.json().catch(() => null);
    return body || { success: false, error: 'Transcription failed (' + res.status + ')' };
  }

  async synthesize({ text, sid, speed, signal, onChunk }) {
    const res = await this._http.authed('/sharing/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sid, speed }),
      signal,
    });
    this._http.throwIfUnauthorized(res);
    if (!res.ok) return VoiceApi._refusal(res);
    const result = { value: { success: true, canceled: false } };
    await StreamFrames.read(res.body, StreamFrames.NDJSON, (line) => VoiceApi._onEvent(StreamFrames.json(line), result, onChunk));
    return result.value;
  }

  static base64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  static async _refusal(res) {
    const body = await res.json().catch(() => null);
    return body || { success: false, error: 'Speech unavailable (' + res.status + ')' };
  }

  static _onEvent(evt, result, onChunk) {
    if (!evt) return;
    const p = evt.payload || {};
    if (evt.type === 'chunk') {
      if (onChunk && p.pcm) onChunk({ seq: p.seq, sampleRate: p.sampleRate || VoiceApi.DEFAULT_SAMPLE_RATE, pcm: VoiceApi.base64ToBytes(p.pcm) });
    } else if (evt.type === 'done') {
      result.value = { success: true, canceled: !!p.canceled };
    } else if (evt.type === 'error') {
      result.value = { success: false, error: p.message || 'synthesis failed', code: p.code || null };
    }
  }
}
