class HotkeyActivity {
  static DONE_MS = 1200;
  static ERROR_MS = 3400;
  static DETAIL_CHARS = 72;
  static CONCEAL_MS = 60;
  static FAILED_TITLES = {
    'read-selection': 'Couldn\'t read the selection',
    'rewrite-selection': 'Couldn\'t rewrite the selection',
    'clipboard-to-chat': 'Couldn\'t send the clipboard',
    'screenshot-to-chat': 'Couldn\'t send the screenshot',
  };

  constructor({ overlay, speech, handoff, options = () => ({ island: true, ring: true }), stopSpeaking = () => {}, log = null }) {
    this._overlay = overlay;
    this._speech = speech;
    this._handoff = handoff;
    this._options = options;
    this._stopSpeaking = stopSpeaking;
    this._log = log || { warn: () => {} };
    this._reading = null;
  }

  enabled() {
    const o = this._options();
    return !!this._overlay && (o.island !== false || o.ring !== false);
  }

  reading({ text, hwnd = 0 }) {
    this._endReading();
    if (!this.enabled() || !this._speech) return null;
    const playback = typeof this._speech.playback === 'function' ? this._speech.playback() : null;
    if (!playback) return null;
    const reading = { utteranceId: playback.utteranceId, text, hwnd, session: null, unsubscribe: null };
    this._reading = reading;
    reading.session = this._overlay.show(this._readingState(playback, reading), (id) => this._onReadingAction(reading, id));
    reading.unsubscribe = this._speech.onState((p) => this._onPlayback(reading, p));
    return reading.session;
  }

  working({ action, title, hwnd = 0, onStop = () => {} }) {
    let canceled = false;
    const session = this.enabled()
      ? this._overlay.show({ ...this._surfaces(), kind: 'busy', title, detail: '', hwnd, actions: [{ id: 'stop', label: 'Stop', icon: 'stop' }] }, (id) => {
        if (id !== 'stop') return;
        canceled = true;
        try { onStop(); } catch (_) {}
        session.close();
      })
      : null;
    return {
      canceled: () => canceled,
      finish: (result, doneTitle) => {
        if (!session || canceled) return;
        if (result && result.success) {
          session.update({ kind: 'done', title: doneTitle, detail: '', actions: [], progress: null });
          session.close({ after: HotkeyActivity.DONE_MS });
        } else {
          this._failInto(session, action, result);
        }
      },
    };
  }

  flash({ action, result, title, hwnd = 0 }) {
    if (!this.enabled()) return false;
    if (result && !result.success) {
      const session = this._overlay.show({ ...this._surfaces(), kind: 'busy', title: '', hwnd, ring: false });
      this._failInto(session, action, result);
      return true;
    }
    const session = this._overlay.show({ ...this._surfaces(), kind: 'done', title, detail: '', hwnd, ring: false, actions: [] });
    session.close({ after: HotkeyActivity.DONE_MS });
    return true;
  }

  async concealed(fn) {
    const overlay = this._overlay;
    if (!overlay || typeof overlay.conceal !== 'function') return fn();
    const restore = overlay.conceal();
    await new Promise((r) => setTimeout(r, HotkeyActivity.CONCEAL_MS));
    try {
      return await fn();
    } finally {
      try { restore(); } catch (_) {}
    }
  }

  dispose() {
    this._endReading();
  }

  _failInto(session, action, result) {
    session.update({
      kind: 'error', ring: false,
      title: HotkeyActivity.FAILED_TITLES[action] || 'Something went wrong',
      detail: (result && result.error) || '',
      actions: [{ id: 'dismiss', label: 'Dismiss', icon: 'close' }],
      progress: null, paused: false,
    });
    session.close({ after: HotkeyActivity.ERROR_MS });
  }

  _surfaces() {
    const o = this._options();
    return { island: o.island !== false, ring: o.ring !== false };
  }

  _readingState(p, reading) {
    const paused = p.state === 'paused';
    return {
      ...this._surfaces(),
      kind: 'speech',
      hwnd: reading.hwnd,
      paused,
      title: paused ? 'Paused' : 'Reading aloud',
      detail: HotkeyActivity.snippet(reading.text),
      progress: typeof p.progress === 'number' ? p.progress : 0,
      actions: [
        paused ? { id: 'play', label: 'Resume', icon: 'play', primary: true } : { id: 'pause', label: 'Pause', icon: 'pause', primary: true },
        { id: 'stop', label: 'Stop', icon: 'stop' },
        { id: 'open', label: 'Continue in LumaBrowser', icon: 'open' },
      ],
    };
  }

  _onPlayback(reading, p) {
    if (this._reading !== reading || !p || p.utteranceId !== reading.utteranceId) return;
    const session = reading.session;
    if (p.state !== 'ended') {
      session.update(this._readingState(p, reading));
      return;
    }
    this._endReading({ keepSession: true });
    if (p.reason === 'stopped') {
      session.close();
    } else if (p.reason === 'failed') {
      this._failInto(session, 'read-selection', { error: p.error || 'Speech failed' });
    } else {
      session.update({ kind: 'done', title: 'Finished reading', detail: '', actions: [], progress: 1, paused: false });
      session.close({ after: HotkeyActivity.DONE_MS });
    }
  }

  _onReadingAction(reading, id) {
    if (id === 'pause') this._speech.pause();
    else if (id === 'play') this._speech.resume();
    else if (id === 'stop') this._stopSpeaking();
    else if (id === 'dismiss') reading.session.close();
    else if (id === 'open') this._continueInLuma(reading);
  }

  _continueInLuma(reading) {
    if (!this._handoff) return;
    Promise.resolve(this._handoff.open({
      prompt: '',
      attachments: [{ kind: 'text', name: 'Selected text.txt', text: reading.text }],
      autoSend: false,
      source: { client: 'hotkeys', via: 'activity-island' },
    })).then((r) => {
      if (r && r.success === false) this._log.warn(`continue in LumaBrowser failed: ${r.error}`);
    }, () => {});
  }

  _endReading({ keepSession = false } = {}) {
    const reading = this._reading;
    if (!reading) return;
    this._reading = null;
    if (reading.unsubscribe) { try { reading.unsubscribe(); } catch (_) {} }
    if (!keepSession && reading.session) reading.session.close();
  }

  static snippet(text) {
    const one = String(text || '').replace(/\s+/g, ' ').trim();
    return one.length > HotkeyActivity.DETAIL_CHARS ? `${one.slice(0, HotkeyActivity.DETAIL_CHARS - 3).trimEnd()}...` : one;
  }
}

module.exports = HotkeyActivity;
