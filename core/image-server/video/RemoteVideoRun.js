const ImageRun = require('../router/ImageRun');
const RemoteVideoAdapter = require('../server/image/RemoteVideoAdapter');

class RemoteVideoRun extends ImageRun {
  static REQUEST_FIELDS = [
    'prompt', 'negativePrompt', 'width', 'height', 'steps', 'cfgScale', 'seed', 'sampler', 'scheduler',
    'videoFrames', 'durationSec', 'fps', 'flowShift',
  ];
  static DEFAULT_MIME = 'video/webm';

  constructor({ send, notify, server, request }) {
    super({ role: 'image-video', send, notify });
    this._server = server;
    this._request = request;
    this._i2v = !!(request && request.firstFrame);
    this._startedAt = Date.now();
  }

  get progressLabel() {
    return this._i2v ? 'Animating image' : 'Generating video';
  }

  get doneLabel() {
    return 'Video generated';
  }

  get nounLabel() {
    return 'Video generation';
  }

  _announce() {
    this._send('status', { phase: 'remote', server: this._server.name || this._server.endpoint });
    this._notify(`${this.progressLabel} on "${this._server.name || 'remote server'}"…`, 'info');
  }

  _launch() {
    const adapter = this._createAdapter();
    if (!adapter) return null;
    return adapter.generate({
      ...this._requestBody(),
      ...this._callbacks((result) => this._complete(result)),
      onMeta: (m) => { if (!this._finished) this._send('meta', m || {}); },
      onStatus: (s) => { if (!this._finished) this._send('status', s || {}); },
      onPreview: (p) => { if (!this._finished && p && p.b64) this._send('preview', { b64: p.b64, mime: p.mime || 'image/png' }); },
    });
  }

  _defaultError() {
    return 'remote video generation failed';
  }

  _createAdapter() {
    try {
      return new RemoteVideoAdapter({ baseUrl: this._server.endpoint, token: this._server.token });
    } catch (err) {
      const message = (err && err.message) || 'invalid remote video server';
      this._send('error', { message });
      this._finish({ success: false, error: message });
      return null;
    }
  }

  _requestBody() {
    const r = this._request;
    const body = { model: this._server.selectedModel || null };
    for (const field of RemoteVideoRun.REQUEST_FIELDS) body[field] = r[field];
    return { ...body, firstFrame: r.firstFrame || null, lastFrame: r.lastFrame || null };
  }

  _complete(result) {
    const wire = result && result.video;
    if (!wire || !wire.b64) return this._fail(new Error('remote host returned no video'));
    const ms = Date.now() - this._startedAt;
    this._notify(`${this.doneLabel} in ${(ms / 1000).toFixed(1)}s (remote)`, 'success');
    const modelId = (result && result.modelId) || null;
    this._send('done', { video: wire, modelId });
    this._finish({ success: true, video: RemoteVideoRun._toLocalShape(wire), modelId });
  }

  static _toLocalShape(wire) {
    return {
      bytes: Buffer.from(wire.b64, 'base64'),
      mime: wire.mime || RemoteVideoRun.DEFAULT_MIME,
      frameCount: wire.frameCount || null,
      fps: wire.fps || null,
      width: wire.width || null,
      height: wire.height || null,
      encoder: wire.encoder || null,
    };
  }
}

module.exports = RemoteVideoRun;
