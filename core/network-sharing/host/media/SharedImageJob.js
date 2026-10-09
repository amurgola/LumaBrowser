const RouteReply = require('../routes/RouteReply');

class SharedImageJob {
  static EDIT_ROLE = 'image-edit';
  static GENERATE_ROLE = 'image-generate';

  constructor(service, role) {
    this._service = service;
    this._role = role;
  }

  async run(req, res) {
    this._setupSharedVariablesFromParameters(req, res);
    const refusal = await this._refusal();
    if (refusal) return RouteReply.send(res, refusal);
    this._openStream();
    return this._generate();
  }

  _setupSharedVariablesFromParameters(req, res) {
    this._req = req;
    this._res = res;
    this._body = req.body || {};
    this._model = typeof this._body.model === 'string' && this._body.model.trim() ? this._body.model.trim() : null;
    this._imagesDelivered = 0;
    this._aborted = false;
    this._finished = false;
  }

  async _refusal() {
    const flags = this._service.getShareFlags();
    if (this._isEdit() && !flags.shareImageEdit) return SharedImageJob._refuse(403, 'image editing is not shared');
    if (!this._isEdit() && !flags.shareImageGen) return SharedImageJob._refuse(403, 'image generation is not shared');
    this._imageRouter = this._service.getImageRouter();
    if (!this._imageRouter || typeof this._imageRouter.generate !== 'function') return SharedImageJob._refuse(503, 'host image server is not ready');
    const denied = this._model ? await this._service.imageModelDenied(this._role, this._model) : null;
    return denied ? SharedImageJob._refuse(403, denied) : null;
  }

  _openStream() {
    this._res.setHeader('Content-Type', 'application/x-ndjson');
    this._res.setHeader('Cache-Control', 'no-cache, no-transform');
    this._res.on('close', () => this._onClose());
  }

  _onClose() {
    if (this._finished) return;
    this._aborted = true;
    try {
      this._imageRouter.abort();
    } catch (_) {}
  }

  async _generate() {
    try {
      await this._service.enqueueImage(() => this._runQueued());
    } catch (err) {
      this._send('error', { message: (err && err.message) || 'generation failed' });
    } finally {
      this._finished = true;
      this._service.recordUsage(this._req.sharingToken, { images: this._imagesDelivered });
      try {
        this._res.end();
      } catch (_) {}
    }
  }

  _runQueued() {
    if (this._aborted) return Promise.resolve({ success: false, aborted: true });
    const body = this._body;
    return this._imageRouter.generate({
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

  _send(type, payload) {
    if (type === 'done' && payload && Array.isArray(payload.images)) this._imagesDelivered += payload.images.length;
    try {
      this._res.write(JSON.stringify({ type, payload }) + '\n');
    } catch (_) {}
  }

  _isEdit() {
    return this._role === SharedImageJob.EDIT_ROLE;
  }

  static _refuse(status, error) {
    return { status, body: { error } };
  }
}

module.exports = SharedImageJob;
