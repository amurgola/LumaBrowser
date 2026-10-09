const ImageAdapterRegistry = require('./server/image/ImageAdapterRegistry');
const ImageModelResolver = require('./router/ImageModelResolver');
const VideoFrameFit = require('./video/VideoFrameFit');
const VideoRequestPlanner = require('./video/VideoRequestPlanner');
const VideoRun = require('./video/VideoRun');
const VideoSlotLauncher = require('./video/VideoSlotLauncher');

class VideoRouter {
  static ROLE = 'image-video';
  static PROTOCOL = 'sd-cpp-video';
  static NO_MODEL = 'No video model configured. Pick one in Image Setup → Video.';

  constructor({ imageServerService, notify, scanner } = {}) {
    if (!imageServerService) throw new Error('VideoRouter: imageServerService is required');
    this._svc = imageServerService;
    this._notify = typeof notify === 'function' ? notify : () => {};
    this._models = new ImageModelResolver({ imageServerService, ...(scanner ? { scanner } : {}) });
    this._launcher = new VideoSlotLauncher({ imageServerService });
    this._active = null;
  }

  async generate(request = {}) {
    if (!request.prompt || typeof request.prompt !== 'string') return { success: false, error: 'prompt is required' };
    const send = typeof request.send === 'function' ? request.send : () => {};
    this.abort();
    const startedAt = Date.now();
    const wantId = ImageModelResolver.idFor(request.modelRef, this._svc.getDefaults().videoModelId);
    if (!wantId) return { success: false, error: VideoRouter.NO_MODEL };
    const model = await this._models.resolve(wantId);
    const refusal = VideoRouter._refusal(wantId, model, request);
    if (refusal) return VideoRouter._fail(send, refusal);
    return this._generateOn(model, { request: VideoRouter._fitted(model, request), wantId, send, startedAt });
  }

  abort() {
    if (this._active) {
      try { this._active.abort(); } catch (_) {}
      this._active = null;
    }
    return { success: true };
  }

  async _generateOn(model, { request, wantId, send, startedAt }) {
    const ready = await this._launcher.ensureReady({ wantId, slotRole: VideoRouter.ROLE, send });
    if (ready.error) return VideoRouter._fail(send, ready.error);
    ready.server.markActive();
    const plan = new VideoRequestPlanner({ lorasDir: this._models.lorasDir() }).plan({ request, model, wantId });
    send('meta', VideoRouter._meta(wantId, ready.status, plan, request.firstFrame));
    return this._run(new VideoRun({
      i2v: !!request.firstFrame,
      send,
      notify: this._notify,
      adapter: this._createAdapter(ready.status),
      server: ready.server,
      plan,
      wantId,
      cold: ready.cold,
      startedAt,
    }));
  }

  static _refusal(wantId, model, request) {
    if (!model) return `Video model "${wantId}" not found in the models directory.`;
    if (!request.firstFrame || model.supportsI2V !== false) return null;
    return `Video model "${wantId}" is text-to-video only: it cannot animate a source image `
      + '(the frame would be silently ignored). Install an image-to-video model such as '
      + '"Wan 2.2 I2V A14B" in Image Setup → Video, or use generate_video for a text-only clip.';
  }

  static _fitted(model, request) {
    if (!request.firstFrame || request.width || request.height) return request;
    const size = VideoFrameFit.fit(model, request.firstFrame);
    return size ? { ...request, width: size.width, height: size.height } : request;
  }

  _createAdapter(status) {
    const auth = this._svc.getApiKeyForLaunch ? this._svc.getApiKeyForLaunch() : { required: false, key: null };
    return ImageAdapterRegistry.createAdapterFor(
      { id: status.plan && status.plan.runtimeId, protocol: VideoRouter.PROTOCOL },
      { baseUrl: `http://127.0.0.1:${status.port}`, apiKey: auth.required ? auth.key : null },
    );
  }

  async _run(run) {
    this._active = run;
    const result = await run.start();
    if (this._active === run) this._active = null;
    return result;
  }

  static _meta(wantId, status, plan, firstFrame) {
    return {
      modelId: wantId,
      runtimeId: status.plan && status.plan.runtimeId,
      port: status.port,
      ...VideoRequestPlanner.metaFields(plan, !!firstFrame),
    };
  }

  static _fail(send, message) {
    send('error', { message });
    return { success: false, error: message };
  }
}

module.exports = VideoRouter;
