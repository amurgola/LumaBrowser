const SharedMediaJob = require('./SharedMediaJob');

class SharedVideoJob extends SharedMediaJob {
  static ROLE = 'image-video';
  static NOT_SHARED = 'video generation is not shared';
  static NOT_READY = 'host video server is not ready';

  async _refusal() {
    if (!this._service.getShareFlags().shareVideoGen) return SharedMediaJob._refuse(403, SharedVideoJob.NOT_SHARED);
    this._router = this._service.getVideoRouter();
    if (!this._router || typeof this._router.generate !== 'function') return SharedMediaJob._refuse(503, SharedVideoJob.NOT_READY);
    const denied = this._model ? await this._service.imageModelDenied(SharedVideoJob.ROLE, this._model) : null;
    return denied ? SharedMediaJob._refuse(403, denied) : null;
  }

  _enqueue(fn) {
    return this._service.enqueueVideo(fn);
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
      videoFrames: body.videoFrames,
      durationSec: body.durationSec,
      fps: body.fps,
      flowShift: body.flowShift,
      firstFrame: body.firstFrame || null,
      lastFrame: body.lastFrame || null,
      forceLocal: true,
      send: (type, payload) => this._send(type, payload),
    });
  }

  _countDelivered(payload) {
    return payload && payload.video && payload.video.b64 ? 1 : 0;
  }

  _usageDelta() {
    return { videos: this._delivered };
  }

  _defaultError() {
    return 'video generation failed';
  }
}

module.exports = SharedVideoJob;
