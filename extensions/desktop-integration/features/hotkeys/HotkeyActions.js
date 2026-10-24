class HotkeyActions {
  static IDS = ['read-selection', 'rewrite-selection', 'clipboard-to-chat', 'screenshot-to-chat'];
  static SPEECH_MS_PER_CHAR = 70;
  static NO_ACTIVITY = {
    enabled: () => false, reading: () => null, flash: () => false, dispose: () => {}, concealed: (fn) => fn(),
    working: () => ({ canceled: () => false, finish: () => {} }),
  };
  static PROMPT_MAX_CHARS = 4000;
  static SPEAK_MAX_CHARS = 4000;

  constructor({ speech, handoff, selection, rewriter, region, clipboard, screenText = null, options = () => ({}), onError = null, now = Date.now, activity = null }) {
    this._screenText = screenText;
    this._speech = speech;
    this._handoff = handoff;
    this._selection = selection;
    this._rewriter = rewriter;
    this._region = region;
    this._clipboard = clipboard;
    this._options = options;
    this._now = now;
    this._utterance = null;
    this._running = new Set();
    this._onError = onError;
    this._activity = activity || HotkeyActions.NO_ACTIVITY;
  }

  supported(id) {
    if (id === 'read-selection' || id === 'rewrite-selection') return this._selection.supported;
    return HotkeyActions.IDS.includes(id);
  }

  busy() {
    return [...this._running];
  }

  speaking() {
    const p = this._speech && typeof this._speech.playback === 'function' ? this._speech.playback() : undefined;
    if (p !== undefined) return !!p && p.state !== 'ended';
    const u = this._utterance;
    return !!u && (!u.synthDone || this._now() < u.until);
  }

  readiness(id, { framed = false } = {}) {
    if (!this.supported(id)) return { disabled: true, note: 'Not available on this system' };
    if (id === 'read-selection' && this.speaking()) return { disabled: false, note: 'Stops reading aloud' };
    if (this._running.has(id)) return { disabled: true, note: 'Already running' };
    if (id === 'read-selection') {
      if (!this._speech || !this._speech.available()) return { disabled: true, note: 'Install a voice first (Settings > Voice)' };
      if (!this.canReadScreen()) return { disabled: false, note: 'Reads the selected text aloud' };
      return { disabled: false, note: framed ? 'Reads the selected text, or all the text in this window' : 'Reads the selected text. Nothing selected? Drag over text on screen.' };
    }
    if (id === 'rewrite-selection') {
      if (this._rewriter && typeof this._rewriter.available === 'function' && !this._rewriter.available()) return { disabled: true, note: 'The AI chat is not running' };
      return { disabled: false, note: 'Rewrites the selected text in place' };
    }
    if (id === 'clipboard-to-chat') {
      return this._clipboardHasContent() ? { disabled: false, note: 'Opens a new chat with what you copied' } : { disabled: true, note: 'The clipboard is empty' };
    }
    return { disabled: false, note: framed ? 'Sends this window to a new chat as an image' : 'Drag over the screen; it opens in a new chat' };
  }

  canReadScreen() {
    const opts = this._options();
    if (opts.readScreen === false || !this._screenText) return false;
    try { return !!this._screenText.available(opts.screenTextModel || ''); } catch (_) { return false; }
  }

  async run(id, source = {}) {
    if (!HotkeyActions.IDS.includes(id)) return { success: false, error: `Unknown action "${id}"`, code: 'UNKNOWN_ACTION' };
    if (!this.supported(id)) return { success: false, error: `"${id}" is not available on this system`, code: 'UNSUPPORTED' };
    if (id === 'read-selection' && this.speaking()) return this.stopSpeaking();
    if (this._running.has(id)) return { success: false, error: `"${id}" is already running`, code: 'BUSY' };
    this._running.add(id);
    try {
      switch (id) {
        case 'read-selection': return await this.readSelection(source);
        case 'rewrite-selection': return await this.rewriteSelection();
        case 'clipboard-to-chat': return await this.clipboardToChat(source);
        default: return await this.screenshotToChat(source);
      }
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err), code: 'FAILED' };
    } finally {
      this._running.delete(id);
    }
  }

  stopSpeaking() {
    this._utterance = null;
    try { this._speech.stop(); } catch (_) {}
    return { success: true, action: 'read-selection', stopped: true };
  }

  async readSelection(source = {}) {
    if (!this._speech || !this._speech.available()) {
      return { success: false, error: 'No voice is installed (Settings > Voice)', code: 'NO_TTS' };
    }
    const grab = await this._selection.copySelection();
    if (grab.success) return this._speakText(grab.text.slice(0, HotkeyActions.SPEAK_MAX_CHARS), grab.hwnd);
    if (grab.code !== 'NO_SELECTION' || !this.canReadScreen()) return grab;
    return this._readScreen(source);
  }

  async _readScreen(source) {
    const frame = source && source.frame;
    const shot = await this._activity.concealed(() => (frame ? this._region.captureRect(frame) : this._region.capture()));
    if (!shot.success) return shot;
    const hwnd = (source && source.hwnd) || 0;
    const work = this._activity.working({ action: 'read-selection', title: 'Reading the text on screen', hwnd });
    const opts = this._options();
    const read = await this._screenText.read(shot.png, { modelRef: opts.screenTextModel || '', timeoutMs: opts.timeoutMs });
    if (work.canceled()) return { success: false, error: 'Reading stopped', code: 'CANCELED' };
    if (!read.success) {
      work.finish(read);
      return { ...read, shown: this._activity.enabled() };
    }
    const spoken = this._speakText(read.text.slice(0, HotkeyActions.SPEAK_MAX_CHARS), hwnd);
    work.finish({ success: true }, 'Reading aloud');
    return { ...spoken, source: frame ? 'window' : 'region' };
  }

  _speakText(text, hwnd) {
    const utterance = { synthDone: false, until: 0, error: null };
    this._utterance = utterance;
    const started = this._now();
    utterance.promise = Promise.resolve(this._speech.speak(text)).then((r) => {
      utterance.synthDone = true;
      utterance.until = r && r.success && !r.canceled ? started + text.length * HotkeyActions.SPEECH_MS_PER_CHAR : 0;
      if (!r || !r.success) {
        utterance.error = (r && r.error) || 'Speech failed';
        if (this._onError) this._onError('read-selection', utterance.error, this._activity.enabled());
      }
      if (this._utterance === utterance && !utterance.until) this._utterance = null;
      return r;
    }, (err) => {
      utterance.synthDone = true;
      if (this._utterance === utterance) this._utterance = null;
      if (this._onError) this._onError('read-selection', (err && err.message) || String(err), this._activity.enabled());
    });
    this._activity.reading({ text, hwnd });
    return { success: true, action: 'read-selection', speaking: true, chars: text.length };
  }

  async rewriteSelection() {
    const grab = await this._selection.copySelection();
    if (!grab.success) return grab;
    const opts = this._options();
    const work = this._activity.working({ action: 'rewrite-selection', title: 'Rewriting selection', hwnd: grab.hwnd });
    const shown = this._activity.enabled();
    const rewritten = await this._rewriter.rewrite(grab.text, { instruction: opts.instruction, modelRef: opts.modelRef, timeoutMs: opts.timeoutMs });
    if (work.canceled()) return { success: false, error: 'Rewrite stopped', code: 'CANCELED' };
    if (!rewritten.success) {
      work.finish(rewritten);
      return { ...rewritten, shown };
    }
    const pasted = await this._selection.pasteText(rewritten.text, { hwnd: grab.hwnd });
    if (!pasted.success) {
      try { this._clipboard.writeText(rewritten.text); } catch (_) {}
      const failed = { ...pasted, error: `${pasted.error}. The rewritten text is on the clipboard.`, text: rewritten.text, onClipboard: true };
      work.finish(failed);
      return { ...failed, shown };
    }
    work.finish({ success: true }, 'Rewritten');
    return { success: true, action: 'rewrite-selection', chars: rewritten.text.length, restored: pasted.restored };
  }

  async clipboardToChat(source) {
    const { prompt, attachments } = this._clipboardContent();
    if (!prompt && !attachments.length) return { success: false, error: 'The clipboard holds no text or image', code: 'EMPTY_CLIPBOARD' };
    const r = await this._handoff.open({ prompt, attachments, autoSend: !!this._options().autoSend, source: HotkeyActions._source(source) });
    if (r && r.success) this._activity.flash({ action: 'clipboard-to-chat', result: r, title: 'Sent to LumaBrowser' });
    return { ...r, action: 'clipboard-to-chat' };
  }

  async screenshotToChat(source) {
    const frame = source && source.frame;
    const shot = await this._activity.concealed(() => (frame ? this._region.captureRect(frame) : this._region.capture()));
    if (!shot.success) return shot;
    const attachments = [{ kind: 'image', name: frame ? 'window.png' : 'screenshot.png', mime: 'image/png', data: shot.png.toString('base64') }];
    const r = await this._handoff.open({ prompt: '', attachments, autoSend: !!this._options().autoSend, source: HotkeyActions._source(source) });
    if (r && r.success) this._activity.flash({ action: 'screenshot-to-chat', result: r, title: 'Sent to LumaBrowser' });
    return { ...r, action: 'screenshot-to-chat', width: shot.width, height: shot.height };
  }

  dispose() {
    if (this.speaking()) this.stopSpeaking();
    this._activity.dispose();
  }

  _clipboardHasContent() {
    try {
      const formats = typeof this._clipboard.availableFormats === 'function' ? this._clipboard.availableFormats() : null;
      if (Array.isArray(formats)) return formats.some((f) => /^(text|image)\//.test(f));
      return !!String(this._clipboard.readText() || '').trim() || !!HotkeyActions._readImage(this._clipboard);
    } catch (_) {
      return true;
    }
  }

  _clipboardContent() {
    const attachments = [];
    let prompt = '';
    const image = HotkeyActions._readImage(this._clipboard);
    if (image) attachments.push({ kind: 'image', name: 'clipboard.png', mime: 'image/png', data: image.toPNG().toString('base64') });
    let text = '';
    try { text = this._clipboard.readText() || ''; } catch (_) { text = ''; }
    if (text.trim()) {
      if (text.length <= HotkeyActions.PROMPT_MAX_CHARS) prompt = text;
      else attachments.push({ kind: 'text', name: 'clipboard.txt', mime: 'text/plain', text });
    }
    return { prompt, attachments };
  }

  static _readImage(clipboard) {
    try {
      const image = typeof clipboard.readImage === 'function' ? clipboard.readImage() : null;
      return image && typeof image.isEmpty === 'function' && !image.isEmpty() ? image : null;
    } catch (_) {
      return null;
    }
  }

  static _source(source) {
    return { client: (source && source.client) || 'hotkeys', app: 'Desktop hotkey' };
  }
}

module.exports = HotkeyActions;
