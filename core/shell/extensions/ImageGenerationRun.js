class ImageGenerationRun {
  static CALLBACK_EVENTS = { status: 'onStatus', progress: 'onProgress', preview: 'onPreview' };
  static DEFAULT_MIME = 'image/png';

  constructor({ router, lab, opts, resolve }) {
    this._router = router;
    this._lab = lab;
    this._opts = opts;
    this._resolve = resolve;
    this._settled = false;
    this._effective = null;
  }

  start() {
    const runOpts = this._labPrepare();
    if (runOpts === null) return;
    if (!this._router || typeof this._router.generate !== 'function') {
      this._finish(null);
      return;
    }
    const send = (type, payload) => this._onEvent(type, payload);
    Promise.resolve(this._router.generate({ ...ImageGenerationRun._routerOpts(runOpts), send })).catch(() => this._finish(null));
  }

  _labPrepare() {
    if (!this._lab) return this._opts;
    try {
      const pre = this._lab.beforeImage(this._opts);
      if (pre && pre.frozen) {
        this._settled = true;
        this._resolve(pre.frozen);
        return null;
      }
      if (pre && pre.opts) return pre.opts;
    } catch (_) {}
    return this._opts;
  }

  _onEvent(type, payload) {
    if (type === 'meta') this._effective = payload || null;
    else if (type === 'done') this._finish(ImageGenerationRun._image(payload));
    else if (type === 'error') this._finish(null);
    else this._forward(type, payload);
  }

  _forward(type, payload) {
    const name = ImageGenerationRun.CALLBACK_EVENTS[type];
    const callback = name ? this._opts[name] : null;
    if (typeof callback !== 'function') return;
    try { callback(payload || {}); } catch (_) {}
  }

  _finish(value) {
    if (this._settled) return;
    this._settled = true;
    if (this._lab) {
      try { this._lab.afterImage(value, this._effective); } catch (_) {}
    }
    this._resolve(value);
  }

  static _image(payload) {
    const img = payload && payload.images && payload.images[0];
    if (!img) return null;
    return { b64: img.b64, mime: img.mime || ImageGenerationRun.DEFAULT_MIME, width: img.width, height: img.height, seed: img.seed };
  }

  static _routerOpts(opts) {
    const { onStatus, onProgress, onPreview, ...routerOpts } = opts;
    return routerOpts;
  }
}

module.exports = ImageGenerationRun;
