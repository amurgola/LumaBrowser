import PcmScheduler from '../../../core/llm-server/ui/js/voice/PcmScheduler.js';

export default class SpeechPlayer {
  static AUDIO_CHANNEL = 'ext.desktop-integration.speech.audio';
  static STOP_CHANNEL = 'ext.desktop-integration.speech.stop';
  static PAUSE_CHANNEL = 'ext.desktop-integration.speech.pause';
  static RESUME_CHANNEL = 'ext.desktop-integration.speech.resume';
  static DONE_CHANNEL = 'ext.desktop-integration.speech.done';
  static STATE_CHANNEL = 'ext.desktop-integration.speechState';

  constructor({ scheduler = null } = {}) {
    this._scheduler = scheduler;
    this._ipc = null;
    this._u = null;
    this._detach = [];
  }

  activate(ipc) {
    if (!ipc || typeof ipc.on !== 'function') return;
    this._ipc = ipc;
    this._detach.push(ipc.on(SpeechPlayer.AUDIO_CHANNEL, (msg) => this.play(msg)));
    this._detach.push(ipc.on(SpeechPlayer.STOP_CHANNEL, () => this.stop()));
    this._detach.push(ipc.on(SpeechPlayer.PAUSE_CHANNEL, (msg) => this.pause(msg)));
    this._detach.push(ipc.on(SpeechPlayer.RESUME_CHANNEL, (msg) => this.resume(msg)));
    this._detach.push(ipc.on(SpeechPlayer.DONE_CHANNEL, (msg) => this.done(msg)));
  }

  deactivate() {
    for (const detach of this._detach) { if (typeof detach === 'function') { try { detach(); } catch (_) {} } }
    this._detach = [];
    this.stop();
    this._ipc = null;
  }

  play(msg) {
    if (!msg || !msg.pcm) return false;
    const scheduler = this._ensure();
    if (!this._u || msg.utteranceId !== this._u.id) {
      if (this._u) scheduler.stop();
      this._resumeClock();
      this._u = { id: msg.utteranceId, scheduled: 0, ended: 0, total: null, sentences: msg.sentences || 1, progress: 0, paused: false, held: [], started: false };
    }
    if (this._u.paused) {
      this._u.held.push(msg);
      return true;
    }
    return this._schedule(this._u, msg);
  }

  done(msg) {
    const u = this._u;
    if (!u || !msg || msg.utteranceId !== u.id) return;
    u.total = Number(msg.chunks) || 0;
    this._maybeEnded(u);
  }

  pause(msg) {
    const u = this._u;
    if (!u || (msg && msg.utteranceId && msg.utteranceId !== u.id) || u.paused) return false;
    u.paused = true;
    const ctx = this._scheduler && this._scheduler.context;
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
    this._report(u, 'paused');
    return true;
  }

  resume(msg) {
    const u = this._u;
    if (!u || (msg && msg.utteranceId && msg.utteranceId !== u.id) || !u.paused) return false;
    u.paused = false;
    this._resumeClock();
    const held = u.held.splice(0);
    for (const m of held) this._schedule(u, m);
    this._report(u, 'playing');
    return true;
  }

  stop() {
    if (this._scheduler) this._scheduler.stop();
    this._resumeClock();
    this._u = null;
  }

  _schedule(u, msg) {
    const sentence = Number.isInteger(msg.sentence) ? msg.sentence : 0;
    const ok = this._ensure().schedule(msg.requestId, { pcm: msg.pcm, sampleRate: msg.sampleRate }, () => this._chunkEnded(u, sentence));
    if (!ok) return false;
    u.scheduled += 1;
    if (!u.started) {
      u.started = true;
      this._report(u, 'playing');
    }
    return true;
  }

  _chunkEnded(u, sentence) {
    if (this._u !== u) return;
    u.ended += 1;
    u.progress = Math.max(u.progress, Math.min(1, (sentence + 1) / Math.max(1, u.sentences)));
    if (!this._maybeEnded(u) && !u.paused) this._report(u, 'playing');
  }

  _maybeEnded(u) {
    if (u.total === null || u.ended < u.total || u.held.length) return false;
    this._u = null;
    u.progress = 1;
    this._report(u, 'ended');
    return true;
  }

  _resumeClock() {
    const ctx = this._scheduler && this._scheduler.context;
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  _report(u, state) {
    if (!this._ipc || typeof this._ipc.invoke !== 'function') return;
    try {
      const pending = this._ipc.invoke(SpeechPlayer.STATE_CHANNEL, { utteranceId: u.id, state, progress: u.progress });
      if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    } catch (_) {}
  }

  _ensure() {
    if (!this._scheduler) this._scheduler = new PcmScheduler();
    return this._scheduler;
  }
}
