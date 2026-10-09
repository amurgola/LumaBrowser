const ImageRun = require('./ImageRun');

class LocalImageRun extends ImageRun {
  constructor({ role, send, notify, adapter, server, plan, wantId, cold = false, startedAt = Date.now() }) {
    super({ role, send, notify });
    this._role = role;
    this._adapter = adapter;
    this._server = server;
    this._plan = plan;
    this._wantId = wantId;
    this._cold = cold;
    this._startedAt = startedAt;
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
    const images = (result && result.images) || [];
    this._send('done', { images: images.map(LocalImageRun._toWire), modelId: this._wantId });
    this._finish({ success: true, images });
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
