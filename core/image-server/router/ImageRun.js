class ImageRun {
  constructor({ role, send, notify }) {
    this._isEdit = role === 'image-edit';
    this._send = send;
    this._notify = notify;
    this._finished = false;
    this._handle = null;
  }

  start() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._announce();
      this._handle = this._launch();
    });
  }

  abort() {
    try { if (this._handle && this._handle.abort) this._handle.abort(); } catch (_) {}
    if (this._finished) return;
    this._send('error', { message: 'aborted' });
    this._notify(`${this.nounLabel} canceled`, 'info');
    this._finish({ success: false, error: 'aborted', aborted: true });
  }

  get finished() {
    return this._finished;
  }

  get progressLabel() {
    return this._isEdit ? 'Editing image' : 'Generating image';
  }

  get doneLabel() {
    return this._isEdit ? 'Image edited' : 'Image generated';
  }

  get nounLabel() {
    return this._isEdit ? 'Image edit' : 'Image generation';
  }

  _announce() {
    throw new Error(`${this.constructor.name} must implement _announce()`);
  }

  _launch() {
    throw new Error(`${this.constructor.name} must implement _launch()`);
  }

  _onSettled() {}

  _callbacks(onDone) {
    return {
      onProgress: (p) => { if (!this._finished) this._send('progress', p || {}); },
      onDone: (result) => { if (!this._finished) onDone(result); },
      onError: (err) => { if (!this._finished) this._fail(err); },
    };
  }

  _fail(err) {
    const message = (err && err.message) || String(err) || this._defaultError();
    this._send('error', { message });
    this._notify(`${this.nounLabel} failed: ${message}`, 'error');
    this._finish({ success: false, error: message });
  }

  _defaultError() {
    return 'generation failed';
  }

  _finish(result) {
    if (this._finished) return;
    this._finished = true;
    this._onSettled();
    this._resolve(result);
  }
}

module.exports = ImageRun;
