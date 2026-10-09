class RemoteImageStream {
  static ERROR_BODY_MAX = 4096;
  static ERROR_DETAIL_MAX = 300;

  static PASS_THROUGH = { meta: 'onMeta', status: 'onStatus', progress: 'onProgress', preview: 'onPreview' };

  constructor(callbacks) {
    this._callbacks = callbacks;
    this._finished = false;
    this._aborted = false;
    this._buffer = '';
  }

  abort() {
    this._aborted = true;
  }

  isAborted() {
    return this._aborted;
  }

  onResponse(res) {
    if (this._aborted) return;
    if (res.status < 200 || res.status >= 300) this._drainError(res);
    else this._readEvents(res.data);
  }

  fail(message) {
    if (this._finished || this._aborted) return;
    this._finished = true;
    this._call('onError', new Error(message));
  }

  _drainError(res) {
    let body = '';
    res.data.on('data', (chunk) => {
      if (body.length < RemoteImageStream.ERROR_BODY_MAX) body += chunk.toString('utf8');
    });
    res.data.on('end', () => this.fail(`remote image server HTTP ${res.status}${body ? `: ${body.slice(0, RemoteImageStream.ERROR_DETAIL_MAX)}` : ''}`));
    res.data.on('error', () => this.fail(`remote image server HTTP ${res.status}`));
  }

  _readEvents(stream) {
    stream.on('data', (chunk) => this._onChunk(chunk));
    stream.on('end', () => this._onEnd());
    stream.on('error', (err) => this.fail((err && err.message) || 'remote image stream error'));
  }

  _onChunk(chunk) {
    this._buffer += chunk.toString('utf8');
    const lines = this._buffer.split(/\r?\n/);
    this._buffer = lines.pop() || '';
    for (const line of lines) this._handleLine(line);
  }

  _onEnd() {
    if (this._buffer) this._handleLine(this._buffer);
    if (!this._finished && !this._aborted) this.fail('remote image stream ended without a result');
  }

  _handleLine(line) {
    const event = RemoteImageStream._parse(line);
    if (!event || this._aborted || this._finished) return;
    this._dispatch(event.type, event.payload);
  }

  _dispatch(type, payload) {
    const callback = RemoteImageStream.PASS_THROUGH[type];
    if (callback) this._call(callback, payload || {});
    else if (type === 'done') this._finish('onDone', payload || { images: [] });
    else if (type === 'error') this._finish('onError', new Error((payload && payload.message) || 'remote generation failed'));
  }

  _finish(callback, value) {
    this._finished = true;
    this._call(callback, value);
  }

  _call(name, value) {
    const callback = this._callbacks[name];
    try {
      if (callback) callback(value);
    } catch (_) {}
  }

  static _parse(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) || null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = RemoteImageStream;
