const ImageRun = require('./ImageRun');
const RefImagePresizer = require('../RefImagePresizer');

class LocalImageRun extends ImageRun {
  constructor({ role, send, notify, adapter, server, plan, wantId, cold = false, startedAt = Date.now(), resize = RefImagePresizer.nativeResize }) {
    super({ role, send, notify });
    this._role = role;
    this._adapter = adapter;
    this._server = server;
    this._plan = plan;
    this._wantId = wantId;
    this._cold = cold;
    this._startedAt = startedAt;
    this._resize = resize;
    this._releaseIdleHold = () => {};
  }

  _announce() {
    this._notify(`${this.progressLabel} with "${this._wantId}"…`, 'info');
  }

  _launch() {
    if (typeof this._server.holdIdle === 'function') this._releaseIdleHold = this._server.holdIdle();
    return this._adapter.generate({
      ...this._plan.params,
      ...this._callbacks((result) => this._complete(result)),
      onPreview: (p) => this._preview(p),
    });
  }

  _onSettled() {
    this._releaseIdleHold();
  }

  _preview(p) {
    if (this._finished || !p || !p.bytes) return;
    this._send('preview', { b64: p.bytes.toString('base64'), mime: p.mime || 'image/png' });
  }

  _complete(result) {
    this._server.markActive();
    const ms = Date.now() - this._startedAt;
    this._log(ms);
    this._notify(`${this.doneLabel} in ${(ms / 1000).toFixed(1)}s`, 'success');
    const images = this._fitOutput((result && result.images) || []);
    this._send('done', { images: images.map(LocalImageRun._toWire), modelId: this._wantId });
    this._finish({ success: true, images, modelId: this._wantId, settings: LocalImageRun._settings(this._plan.params) });
  }

  _fitOutput(images) {
    const size = this._plan.outputSize;
    if (!size || !(size.width > 0 && size.height > 0)) return images;
    return images.map((img) => this._fitOne(img, size));
  }

  _fitOne(img, size) {
    if (!img || !Buffer.isBuffer(img.bytes)) return img;
    try {
      const bytes = this._resize(img.bytes, size.width, size.height);
      return bytes ? { ...img, bytes, mime: 'image/png', width: size.width, height: size.height } : img;
    } catch (_) {
      return img;
    }
  }

  static _settings(p) {
    const params = p || {};
    return {
      steps: params.steps != null ? params.steps : null,
      cfgScale: params.cfgScale != null ? params.cfgScale : null,
      sampler: params.sampler || null,
      scheduler: params.scheduler || null,
    };
  }

  _log(ms) {
    const p = this._plan.params;
    console.log(`[image-server] ${this._role} ${this._cold ? 'COLD' : 'warm'} request "${this._wantId}" finished in ${ms}ms`
      + ` refs=${this._plan.refCount} steps=${p.steps} cfg=${p.cfgScale} sampler=${p.sampler}`
      + `${p.scheduler ? ` scheduler=${p.scheduler}` : ''}`
      + `${this._cold ? ' (incl. model load)' : ' (model already resident)'}`);
  }

  static _toWire(img) {
    return {
      b64: img.bytes ? img.bytes.toString('base64') : null,
      mime: img.mime || 'image/png',
      width: img.width || null,
      height: img.height || null,
      seed: img.seed != null ? img.seed : null,
    };
  }
}

module.exports = LocalImageRun;
