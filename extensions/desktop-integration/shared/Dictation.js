class Dictation {
  static START_CHANNEL = 'ext.desktop-integration.dictation.start';
  static STOP_CHANNEL = 'ext.desktop-integration.dictation.stop';
  static CANCEL_CHANNEL = 'ext.desktop-integration.dictation.cancel';
  static OPEN_TIMEOUT_MS = 8000;
  static AUDIO_TIMEOUT_MS = 5000;
  static MIN_AUDIO_MS = 300;
  static NOISE_MARKS = /\[[^\]]*\]|\([^)]*\)/g;
  static NOT_SET_UP = 'Speech recognition is not set up yet. Click the microphone in the chat once to install it.';
  static NOTHING_HEARD = 'Nothing was heard';

  constructor({ getStt = () => null, send = () => {}, setTimeout: startTimer = setTimeout, clearTimeout: stopTimer = clearTimeout } = {}) {
    this._getStt = getStt;
    this._send = send;
    this._startTimer = startTimer;
    this._stopTimer = stopTimer;
    this._session = null;
    this._counter = 0;
    this._ready = false;
  }

  get active() {
    return !!this._session;
  }

  get listening() {
    return !!this._session && this._session.state === 'listening';
  }

  available() {
    this.refresh();
    return this._ready;
  }

  async refresh() {
    try {
      const stt = this._getStt();
      const view = stt && typeof stt.getView === 'function' ? await stt.getView() : null;
      this._ready = Boolean(view && view.runtimeReady && Array.isArray(view.models) && view.models.length);
    } catch (_) {
      this._ready = false;
    }
    return this._ready;
  }

  async begin() {
    if (this._session) return Dictation._fail('Dictation is already running', 'BUSY');
    const stt = this._getStt();
    if (!stt || typeof stt.transcribe !== 'function') return Dictation._fail('Speech recognition is not available', 'NO_STT');
    const session = { id: `dict-${++this._counter}`, state: 'opening', waiter: null };
    this._session = session;
    if (!(await this.refresh())) return this._end(session, Dictation._fail(Dictation.NOT_SET_UP, 'NO_STT_MODEL'));
    if (this._session !== session) return Dictation._canceled();
    this._warm(stt);
    const opened = await this._ask(session, Dictation.START_CHANNEL, 'started', Dictation.OPEN_TIMEOUT_MS);
    if (this._session !== session) return Dictation._canceled();
    if (!opened) {
      this.cancel();
      return Dictation._fail('LumaBrowser\'s window did not open the microphone', 'NO_MICROPHONE');
    }
    if (opened.type === 'failed') return this._end(session, Dictation._fail(opened.error || 'The microphone could not be opened', 'MIC_FAILED'));
    session.state = 'listening';
    return { success: true, sessionId: session.id };
  }

  async finish() {
    const session = this._session;
    if (!session || session.state !== 'listening') return Dictation._fail('Dictation is not listening', 'NOT_LISTENING');
    session.state = 'transcribing';
    const audio = await this._ask(session, Dictation.STOP_CHANNEL, 'audio', Dictation.AUDIO_TIMEOUT_MS);
    if (this._session !== session) return Dictation._canceled();
    if (!audio) {
      this.cancel();
      return Dictation._fail('The recording did not arrive', 'FAILED');
    }
    const result = await this._transcribe(audio);
    if (this._session !== session) return Dictation._canceled();
    return this._end(session, result);
  }

  cancel() {
    const session = this._session;
    if (!session) return { success: true, canceled: false };
    this._session = null;
    this._settle(session, null);
    try { this._send(Dictation.CANCEL_CHANNEL, { sessionId: session.id }); } catch (_) {}
    return { success: true, canceled: true };
  }

  report(update) {
    const session = this._session;
    if (!session || !update || update.sessionId !== session.id || !session.waiter) return false;
    if (update.type !== session.waiter.type && update.type !== 'failed') return false;
    this._settle(session, update);
    return true;
  }

  _ask(session, channel, type, timeoutMs) {
    return new Promise((resolve) => {
      const timer = this._startTimer(() => this._settle(session, null), timeoutMs);
      session.waiter = { type, resolve, timer };
      try { this._send(channel, { sessionId: session.id }); } catch (_) {}
    });
  }

  _settle(session, answer) {
    const waiter = session.waiter;
    if (!waiter) return;
    session.waiter = null;
    this._stopTimer(waiter.timer);
    waiter.resolve(answer);
  }

  _end(session, result) {
    if (this._session === session) this._session = null;
    return result;
  }

  async _transcribe(audio) {
    if (audio.type === 'failed') return Dictation._fail(audio.error || 'The recording failed', 'FAILED');
    if (!audio.wav || Number(audio.durationMs) < Dictation.MIN_AUDIO_MS) return Dictation._fail(Dictation.NOTHING_HEARD, 'EMPTY');
    try {
      const result = await this._getStt().transcribe(audio.wav);
      const text = Dictation.clean(result && result.text);
      if (!text) return Dictation._fail(Dictation.NOTHING_HEARD, 'EMPTY');
      return { success: true, text, durationMs: (result && result.durationMs) || 0 };
    } catch (err) {
      return Dictation._fail((err && err.message) || String(err), (err && err.code) || 'FAILED');
    }
  }

  _warm(stt) {
    if (typeof stt.ensureRunning !== 'function') return;
    Promise.resolve().then(() => stt.ensureRunning()).catch(() => {});
  }

  static clean(text) {
    return String(text == null ? '' : text).replace(Dictation.NOISE_MARKS, ' ').replace(/\s+/g, ' ').trim();
  }

  static _canceled() {
    return Dictation._fail('Dictation was canceled', 'CANCELED');
  }

  static _fail(error, code) {
    return { success: false, error, code };
  }
}

module.exports = Dictation;
