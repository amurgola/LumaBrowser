const ActionSentence = require('./ActionSentence');

class RunPresence {
  static IDLE_MS = 6000;
  static DONE_MS = 1400;
  static ERROR_MS = 3400;
  static DETAIL_CHARS = 72;
  static TICK_MS = 1000;
  static CONTROLS = [{ id: 'pause', label: 'Pause', icon: 'pause', primary: true }, { id: 'stop', label: 'Stop', icon: 'stop' }];
  static PAUSED_CONTROLS = [{ id: 'resume', label: 'Continue', icon: 'play', primary: true }, { id: 'stop', label: 'Stop', icon: 'stop' }];

  constructor({ overlay, options = () => ({ show: true, ring: true }), onAction = () => {}, onChange = () => {}, log = null, setTimeout: st = setTimeout, clearTimeout: ct = clearTimeout }) {
    this._overlay = overlay || null;
    this._options = options;
    this._onAction = onAction;
    this._onChange = onChange;
    this._log = log || { warn: () => {} };
    this._st = st;
    this._ct = ct;
    this._session = null;
    this._idle = null;
    this._step = 0;
    this._paused = false;
    this._waiting = null;
    this._last = null;
    this._sentence = '';
    this._detach = null;
    this._progress = null;
    this._tick = null;
    this._now = Date.now;
  }

  attach(desktop) {
    this.detach();
    const offActivity = desktop.activity.subscribe((e) => this.onActivity(e));
    const offControl = desktop.control.subscribe((event, detail) => this.onControl(event, detail));
    this._paused = !!desktop.control.paused;
    this._detach = () => { offActivity(); offControl(); };
    return () => this.detach();
  }

  detach() {
    if (this._detach) { this._detach(); this._detach = null; }
  }

  get live() {
    return !!this._session || this._paused;
  }

  get paused() {
    return this._paused;
  }

  get snapshot() {
    return {
      live: this.live,
      paused: this._paused,
      step: this._step,
      window: this._last ? { hwnd: this._last.hwnd, title: this._last.title } : null,
      action: this._sentence || null,
      waiting: this._waiting ? ActionSentence.of(this._waiting) : null,
      progress: this._progress ? { ...this._progress } : null,
    };
  }

  onProgress(p) {
    if (!p) return;
    if (p.done) {
      this._progress = null;
    } else {
      this._progress = { iteration: p.iteration, maxIterations: p.maxIterations, startedAt: p.startedAt || (this._now() - (p.elapsedMs || 0)) };
    }
    if (this._session && !this._paused) this._session.update({ detail: this._detailLine() });
  }

  _detailLine(suffix = '') {
    const parts = [];
    const p = this._progress;
    if (p) {
      parts.push(p.maxIterations ? `Step ${p.iteration} of ${p.maxIterations}` : `Step ${p.iteration}`);
      parts.push(`${Math.max(0, Math.round((this._now() - p.startedAt) / 1000))} s`);
    } else if (this._step) {
      parts.push(`Action ${this._step}`);
    }
    if (this._last && this._last.title && this._last.hwnd !== 0) parts.push(`in ${RunPresence.clip(this._last.title, 40)}`);
    return `${parts.join(' \u00b7 ')}${suffix}`;
  }

  onActivity(e) {
    if (!e || !e.action) return;
    if (e.phase === 'start') this._started(e);
    else if (e.phase === 'end') this._ended(e);
  }

  onControl(event, detail = {}) {
    if (event === 'pause') this._pausedNow();
    else if (event === 'waiting') { this._waiting = detail.info || null; this._pausedNow(); }
    else if (event === 'resume') this._resumed();
    else if (event === 'stop') this._stopped();
  }

  showStopped() {
    this._stopped();
  }

  dispose() {
    this.detach();
    this._clearIdle();
    this._stopTick();
    if (this._session) { try { this._session.close(); } catch (_) {} }
    this._session = null;
  }

  _started(e) {
    this._step += 1;
    this._last = e;
    this._sentence = ActionSentence.of(e);
    this._waiting = null;
    this._clearIdle();
    this._paint({
      kind: 'busy', paused: false,
      title: this._sentence,
      detail: this._detailLine(),
      actions: RunPresence.CONTROLS,
    }, e.hwnd);
    this._startTick();
    this._changed();
  }

  _ended(e) {
    if (!this._session) return;
    if (e.success) {
      this._session.update({ detail: this._detailLine(' · done') });
      if (e.hwnd === 0 && typeof this._overlay.conceal === 'function') { this._restore = this._overlay.conceal(); }
      this._idleClose(RunPresence.IDLE_MS);
    } else if (e.code === 'STOPPED') {
      this._stopped();
    } else {
      this._session.update({ kind: 'error', ring: false, title: `Couldn't: ${this._sentence}`, detail: RunPresence.clip(e.error || ''), actions: RunPresence.CONTROLS });
      this._idleClose(RunPresence.ERROR_MS);
    }
  }

  _pausedNow() {
    this._paused = true;
    this._clearIdle();
    this._stopTick();
    const waiting = this._waiting ? `Waiting to: ${ActionSentence.of(this._waiting)}` : 'Luma waits before its next desktop action';
    this._paint({ kind: 'busy', paused: true, title: 'Paused', detail: waiting, actions: RunPresence.PAUSED_CONTROLS }, this._waiting ? this._waiting.hwnd : (this._last ? this._last.hwnd : 0));
    this._changed();
  }

  _resumed() {
    this._paused = false;
    this._waiting = null;
    if (this._session) {
      this._session.update({ kind: 'busy', paused: false, title: 'Continuing', detail: this._detailLine(), actions: RunPresence.CONTROLS });
      this._idleClose(RunPresence.IDLE_MS);
      this._startTick();
    }
    this._changed();
  }

  _stopped() {
    this._paused = false;
    this._waiting = null;
    this._clearIdle();
    this._stopTick();
    const session = this._session || this._open({ kind: 'busy', title: 'Stopped' }, this._last ? this._last.hwnd : 0);
    if (session) {
      session.update({ kind: 'done', paused: false, title: 'Stopped', detail: 'Luma stopped acting on your desktop', actions: [], progress: null });
      session.close({ after: RunPresence.DONE_MS });
    }
    this._session = null;
    this._step = 0;
    this._changed();
  }

  _paint(state, hwnd) {
    if (this._session) {
      this._restored();
      this._session.update({ ...state, frame: hwnd || 0, hwnd: hwnd || 0 });
    } else {
      this._open(state, hwnd);
    }
  }

  _open(state, hwnd) {
    const o = this._options();
    if (!this._overlay || o.show === false) return null;
    this._restored();
    const session = this._overlay.show({ ...state, ring: o.ring !== false, island: true, frame: hwnd || 0, hwnd: hwnd || 0 }, (id) => {
      try { this._onAction(id); } catch (err) { this._log.warn(`island ${id} failed: ${(err && err.message) || err}`); }
    });
    this._session = session;
    return session;
  }

  _idleClose(ms) {
    this._clearIdle();
    this._idle = this._st(() => {
      this._idle = null;
      if (this._paused) return;
      const session = this._session;
      this._session = null;
      this._step = 0;
      this._stopTick();
      this._restored();
      if (session) session.close();
      this._changed();
    }, ms);
    if (this._idle && typeof this._idle.unref === 'function') this._idle.unref();
  }

  _startTick() {
    this._stopTick();
    if (!this._session || !this._progress) return;
    this._tick = this._st(() => {
      this._tick = null;
      if (!this._session || this._paused) return;
      this._session.update({ detail: this._detailLine() });
      this._startTick();
    }, RunPresence.TICK_MS);
    if (this._tick && typeof this._tick.unref === 'function') this._tick.unref();
  }

  _stopTick() {
    if (this._tick) { this._ct(this._tick); this._tick = null; }
  }

  _clearIdle() {
    if (this._idle) { this._ct(this._idle); this._idle = null; }
  }

  _restored() {
    if (this._restore) { try { this._restore(); } catch (_) {} this._restore = null; }
  }

  _changed() {
    try { this._onChange(this.snapshot); } catch (_) {}
  }

  static clip(text, max = RunPresence.DETAIL_CHARS) {
    const one = String(text || '').replace(/\s+/g, ' ').trim();
    return one.length > max ? `${one.slice(0, max - 3).trimEnd()}...` : one;
  }
}

module.exports = RunPresence;
