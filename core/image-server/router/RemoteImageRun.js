const RemoteImageAdapter = require('../server/image/RemoteImageAdapter');
const ImageRun = require('./ImageRun');

class RemoteImageRun extends ImageRun {
  static REQUEST_FIELDS = [
    'prompt', 'negativePrompt', 'width', 'height', 'steps', 'cfgScale', 'seed', 'sampler', 'scheduler', 'strength',
  ];

  constructor({ role, send, notify, server, request }) {
    super({ role, send, notify });
    this._role = role === 'image-edit' ? 'image-edit' : 'image-generate';
    this._server = server;
    this._request = request;
    this._startedAt = Date.now();
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
    return 'remote generation failed';
  }

  _createAdapter() {
    try {
      return new RemoteImageAdapter({ baseUrl: this._server.endpoint, token: this._server.token, role: this._role });
    } catch (err) {
      const message = (err && err.message) || 'invalid remote image server';
      this._send('error', { message });
      this._finish({ success: false, error: message });
      return null;
    }
  }

  _requestBody() {
    const r = this._request;
    const body = { model: this._server.selectedModel || null };
    for (const field of RemoteImageRun.REQUEST_FIELDS) body[field] = r[field];
    return { ...body, initImage: r.initImage || null, refImages: r.refImages || null, mask: r.mask || null };
  }

  _complete(result) {
    const ms = Date.now() - this._startedAt;
    this._notify(`${this.doneLabel} in ${(ms / 1000).toFixed(1)}s (remote)`, 'success');
    const images = (result && result.images) || [];
    this._send('done', { images, modelId: (result && result.modelId) || null });
    this._finish({ success: true, images: images.map(RemoteImageRun._toLocalShape) });
  }

  static _toLocalShape(img) {
    return {
      bytes: img && img.b64 ? Buffer.from(img.b64, 'base64') : null,
      mime: (img && img.mime) || 'image/png',
      width: (img && img.width) || null,
      height: (img && img.height) || null,
      seed: img && img.seed != null ? img.seed : null,
    };
  }
}

module.exports = RemoteImageRun;
