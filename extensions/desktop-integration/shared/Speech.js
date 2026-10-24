class Speech {
  static AUDIO_CHANNEL = 'ext.desktop-integration.speech.audio';
  static STOP_CHANNEL = 'ext.desktop-integration.speech.stop';
  static PAUSE_CHANNEL = 'ext.desktop-integration.speech.pause';
  static RESUME_CHANNEL = 'ext.desktop-integration.speech.resume';
  static DONE_CHANNEL = 'ext.desktop-integration.speech.done';
  static STATES = new Set(['playing', 'paused', 'ended']);
  static MAX_CHARS = 4000;
  static CHUNK_CHARS = 280;

  constructor({ getTts = () => null, send = () => {} } = {}) {
    this._getTts = getTts;
    this._send = send;
    this._current = null;
    this._counter = 0;
    this._playback = null;
    this._listeners = new Set();
  }

  playback() {
    return this._playback ? { ...this._playback } : null;
  }

  onState(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  report(update) {
    const p = this._playback;
    if (!p || !update || update.utteranceId !== p.utteranceId || p.state === 'ended') return false;
    if (!Speech.STATES.has(update.state)) return false;
    const progress = Number(update.progress);
    this._setPlayback({ ...p, state: update.state, progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : p.progress });
    return true;
  }

  pause() {
    return this._control('paused', Speech.PAUSE_CHANNEL, (s) => s === 'playing' || s === 'synthesizing');
  }

  resume() {
    return this._control('playing', Speech.RESUME_CHANNEL, (s) => s === 'paused');
  }

  _control(next, channel, allowed) {
    const p = this._playback;
    if (!p || !allowed(p.state)) return { success: false, error: 'Nothing to ' + (next === 'paused' ? 'pause' : 'resume'), state: p ? p.state : null };
    try { this._send(channel, { utteranceId: p.utteranceId }); } catch (_) {}
    this._setPlayback({ ...p, state: next });
    return { success: true, state: next };
  }

  _setPlayback(next) {
    this._playback = next;
    for (const fn of this._listeners) { try { fn({ ...next }); } catch (_) {} }
  }

  available() {
    try {
      const tts = this._getTts();
      const view = tts && typeof tts.getView === 'function' ? tts.getView() : null;
      return Boolean(view && view.runtimeReady && Array.isArray(view.models) && view.models.length);
    } catch (_) {
      return false;
    }
  }

  async speak(text, { voice = null } = {}) {
    const clean = String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, Speech.MAX_CHARS);
    if (!clean) return { success: false, error: 'Nothing to say' };
    const tts = this._getTts();
    if (!tts || typeof tts.synthesize !== 'function') return { success: false, error: 'Text-to-speech is not available', code: 'NO_TTS' };
    if (!this.available()) return { success: false, error: 'No voice is installed (Settings > Voice)', code: 'NO_TTS_MODEL' };
    this.stop();
    const parts = Speech.sentences(clean);
    const utterance = { id: `utt-${++this._counter}`, handles: [], canceled: false, chunks: 0, count: parts.length };
    this._current = utterance;
    this._setPlayback({ utteranceId: utterance.id, state: 'synthesizing', progress: 0, text: clean });
    try {
      for (let i = 0; i < parts.length; i++) {
        if (utterance.canceled) break;
        await this._synthesizePart(tts, utterance, parts[i], Speech._sid(voice), i);
      }
      this._finishSynthesis(utterance, null);
      return { success: true, utteranceId: utterance.id, chunks: utterance.chunks, canceled: utterance.canceled };
    } catch (err) {
      this._finishSynthesis(utterance, (err && err.message) || String(err));
      return { success: false, error: (err && err.message) || String(err), code: err && err.code };
    } finally {
      if (this._current === utterance) this._current = null;
    }
  }

  _finishSynthesis(utterance, error) {
    try { this._send(Speech.DONE_CHANNEL, { utteranceId: utterance.id, chunks: utterance.chunks }); } catch (_) {}
    const p = this._playback;
    if (!p || p.utteranceId !== utterance.id || p.state === 'ended') return;
    if (error || !utterance.chunks) this._setPlayback({ ...p, state: 'ended', reason: error ? 'failed' : 'empty', error: error || undefined });
  }

  stop() {
    const utterance = this._current;
    this._current = null;
    if (utterance) {
      utterance.canceled = true;
      const tts = this._getTts();
      for (const id of utterance.handles) { try { tts.cancel(id); } catch (_) {} }
    }
    try { this._send(Speech.STOP_CHANNEL, { utteranceId: utterance ? utterance.id : null }); } catch (_) {}
    const p = this._playback;
    const audible = !!p && p.state !== 'ended';
    if (audible) this._setPlayback({ ...p, state: 'ended', reason: 'stopped' });
    return { success: true, stopped: !!utterance || audible };
  }

  async _synthesizePart(tts, utterance, part, sid, index = 0) {
    const args = sid == null ? { text: part } : { text: part, sid };
    const handle = tts.synthesize(args, (chunk) => {
      if (utterance.canceled || !chunk) return;
      utterance.chunks += 1;
      this._send(Speech.AUDIO_CHANNEL, {
        utteranceId: utterance.id, requestId: handle.id, seq: chunk.seq, sampleRate: chunk.sampleRate, pcm: chunk.pcm,
        sentence: index, sentences: utterance.count,
      });
    });
    utterance.handles.push(handle.id);
    const result = await handle.done;
    if (result && result.canceled) utterance.canceled = true;
  }

  static sentences(text) {
    const parts = String(text).match(/[^.!?\n]+[.!?]*\s*/g) || [String(text)];
    const out = [];
    for (const raw of parts) {
      let piece = raw.trim();
      while (piece.length > Speech.CHUNK_CHARS) {
        const cut = piece.lastIndexOf(' ', Speech.CHUNK_CHARS);
        const at = cut > 0 ? cut : Speech.CHUNK_CHARS;
        out.push(piece.slice(0, at).trim());
        piece = piece.slice(at).trim();
      }
      if (piece) out.push(piece);
    }
    return out;
  }

  static _sid(voice) {
    if (voice == null || voice === '') return null;
    const n = Number(voice);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }
}

module.exports = Speech;
