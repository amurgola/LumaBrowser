const SharedMediaJob = require('./SharedMediaJob');

class SharedImageJob extends SharedMediaJob {
  static EDIT_ROLE = 'image-edit';
  static GENERATE_ROLE = 'image-generate';

  constructor(service, role) {
    super(service);
    this._role = role;
  }

  async _refusal() {
    const flags = this._service.getShareFlags();
    if (this._isEdit() && !flags.shareImageEdit) return SharedMediaJob._refuse(403, 'image editing is not shared');
    if (!this._isEdit() && !flags.shareImageGen) return SharedMediaJob._refuse(403, 'image generation is not shared');
    this._router = this._service.getImageRouter();
    if (!this._router || typeof this._router.generate !== 'function') return SharedMediaJob._refuse(503, 'host image server is not ready');
    const denied = this._model ? await this._service.imageModelDenied(this._role, this._model) : null;
    return denied ? SharedMediaJob._refuse(403, denied) : null;
  }

  _enqueue(fn) {
    return this._service.enqueueImage(fn);
  }

  _generateOnRouter() {
    const body = this._body;
    return this._router.generate({
      modelRef: this._model || undefined,
      prompt: body.prompt,
      negativePrompt: body.negativePrompt,
      width: body.width,
      height: body.height,
      steps: body.steps,
      cfgScale: body.cfgScale,
      seed: body.seed,
      sampler: body.sampler,
      scheduler: body.scheduler,
      initImage: body.initImage || null,
      strength: body.strength,
      refImages: Array.isArray(body.refImages) ? body.refImages : null,
      mask: body.mask || null,
      slot: this._isEdit() ? 'edit' : 'generate',
      forceLocal: true,
      send: (type, payload) => this._send(type, payload),
    });
  }

  _countDelivered(payload) {
    return payload && Array.isArray(payload.images) ? payload.images.length : 0;
  }

  _usageDelta() {
    return { images: this._delivered };
  }

  _isEdit() {
    return this._role === SharedImageJob.EDIT_ROLE;
  }
}

module.exports = SharedImageJob;
