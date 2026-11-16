class DictateAction {
  static ID = 'dictate';
  static MAX_LISTEN_MS = 5 * 60 * 1000;
  static SETUP_NOTE = 'Set up speech recognition first (click the microphone in the chat)';

  constructor({ dictation, selection, clipboard, activity, foreground = () => 0, onError = null, setTimeout: startTimer = setTimeout, clearTimeout: stopTimer = clearTimeout }) {
    this._dictation = dictation;
    this._selection = selection;
    this._clipboard = clipboard;
    this._activity = activity;
    this._foreground = foreground;
    this._onError = onError;
    this._startTimer = startTimer;
    this._stopTimer = stopTimer;
    this._island = null;
    this._limit = null;
  }

  get supported() {
    return !!this._dictation && this._selection.supported;
  }

  listening() {
    return !!this._island;
  }

  readiness() {
    if (this.listening()) return { disabled: false, note: 'Types what you said where the cursor is' };
    if (this._dictation.active) return { disabled: true, note: 'Already running' };
    if (!this._dictation.available()) return { disabled: true, note: DictateAction.SETUP_NOTE };
    return { disabled: false, note: 'Speak, then press again: your words are typed where the cursor is' };
  }

  toggle() {
    if (this.listening()) return this.finish();
    if (this._dictation.active) return Promise.resolve({ success: false, error: 'Dictation is already running', code: 'BUSY' });
    return this.start();
  }

  async start() {
    const began = await this._dictation.begin();
    if (!began.success) return began;
    this._island = this._activity.listening({
      action: DictateAction.ID,
      hwnd: this._windowInFront(),
      onDone: () => this._finishUnasked(),
      onCancel: () => this.cancel(),
    });
    this._limit = this._startTimer(() => this._finishUnasked(), DictateAction.MAX_LISTEN_MS);
    if (this._limit && typeof this._limit.unref === 'function') this._limit.unref();
    return { success: true, action: DictateAction.ID, listening: true };
  }

  async finish() {
    const island = this._takeIsland();
    if (!island) return { success: false, error: 'Dictation is not listening', code: 'NOT_LISTENING' };
    island.transcribing();
    const shown = this._activity.enabled();
    const heard = await this._dictation.finish();
    if (island.canceled()) return { success: false, error: 'Dictation was canceled', code: 'CANCELED' };
    if (!heard.success) {
      island.finish(heard);
      return { ...heard, shown };
    }
    const pasted = await this._selection.pasteText(heard.text);
    if (!pasted.success) {
      try { await this._clipboard.writeText(heard.text); } catch (_) {}
      const failed = { ...pasted, error: `${pasted.error}. What you said is on the clipboard.`, text: heard.text, onClipboard: true };
      island.finish(failed);
      return { ...failed, shown };
    }
    island.finish({ success: true }, 'Typed');
    return { success: true, action: DictateAction.ID, text: heard.text, chars: heard.text.length, restored: pasted.restored };
  }

  cancel() {
    this._takeIsland();
    return this._dictation.cancel();
  }

  dispose() {
    if (this._island || this._dictation.active) this.cancel();
  }

  _finishUnasked() {
    return this.finish().then((result) => {
      if (!result.success && result.code !== 'CANCELED' && this._onError) this._onError(DictateAction.ID, result.error, !!result.shown);
      return result;
    });
  }

  _takeIsland() {
    const island = this._island;
    this._island = null;
    this._stopTimer(this._limit);
    this._limit = null;
    return island;
  }

  _windowInFront() {
    try { return this._foreground() || 0; } catch (_) { return 0; }
  }
}

module.exports = DictateAction;
