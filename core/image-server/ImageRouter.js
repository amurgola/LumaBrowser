const ImageAdapterRegistry = require('./server/image/ImageAdapterRegistry');
const ImageCapacityRescue = require('./router/ImageCapacityRescue');
const HeldRunEvents = require('./router/HeldRunEvents');
const ImageEditPromptInfo = require('./router/ImageEditPromptInfo');
const ImageModelInfo = require('./router/ImageModelInfo');
const ImageModelResolver = require('./router/ImageModelResolver');
const ImageRequestPlanner = require('./router/ImageRequestPlanner');
const ImageSlotLauncher = require('./router/ImageSlotLauncher');
const ImageSlotPicker = require('./router/ImageSlotPicker');
const LocalImageRun = require('./router/LocalImageRun');
const RemoteImageRun = require('./router/RemoteImageRun');

class ImageRouter {
  static RENDERING_PHASE = 'rendering-image';

  constructor({ imageServerService, notify, scanner, presize } = {}) {
    if (!imageServerService) throw new Error('ImageRouter: imageServerService is required');
    this._svc = imageServerService;
    this._notify = typeof notify === 'function' ? notify : () => {};
    this._presize = presize;
    this._models = new ImageModelResolver({ imageServerService, scanner });
    this._launcher = new ImageSlotLauncher({ imageServerService });
    this._info = new ImageModelInfo({ imageServerService, models: this._models });
    this._editInfo = new ImageEditPromptInfo({ imageServerService, models: this._models });
    this._rescue = new ImageCapacityRescue({ getSettingsDb: () => this._svc.settingsDb, log: (message) => console.log(message) });
    this._active = null;
  }

  async generate(request = {}) {
    if (!request.prompt || typeof request.prompt !== 'string') return { success: false, error: 'prompt is required' };
    const send = typeof request.send === 'function' ? request.send : () => {};
    this.abort();
    const remote = this._remoteServerFor(request);
    if (remote) return this._run(new RemoteImageRun({ role: ImageSlotPicker.remoteRole(request.slot), send, notify: this._notify, server: remote, request }));
    return this._generateLocal(request, send);
  }

  abort() {
    if (this._active) {
      try { this._active.abort(); } catch (_) {}
      this._active = null;
    }
    return { success: true };
  }

  async getModelNativeSize(modelRef = null) {
    return this._info.nativeSize(modelRef);
  }

  async getFrameSizes(modelRef = null, picks = null) {
    return this._info.frameSizes(modelRef, picks);
  }

  async getEditPromptInfo(picks = null) {
    return this._editInfo.resolve(picks);
  }

  async getActivePromptInfo(role = 'generate', picks = null) {
    return this._info.activePromptInfo(role, picks);
  }

  _remoteServerFor(request) {
    if (request.forceLocal || !this._svc.getActiveServer) return null;
    const server = this._svc.getActiveServer(ImageSlotPicker.remoteRole(request.slot));
    return server && server.location === 'remote' ? server : null;
  }

  async _generateLocal(request, send) {
    const held = new HeldRunEvents(send, this._notify);
    const startedAt = Date.now();
    const first = await this._generateLocalOnce(request, held.send, held.notify);
    if (ImageRouter._delivered(first.result) || first.result.aborted || !first.server) return held.release(first.result);
    if (!(await this._rescue.prepare(first.server, first.modelId, startedAt))) return held.release(first.result);
    held.discard();
    return (await this._generateLocalOnce(request, send, this._notify)).result;
  }

  async _generateLocalOnce(request, send, notify) {
    const startedAt = Date.now();
    const target = await this._resolveTarget(request);
    if (target.error) return { result: { success: false, error: target.error } };
    const ready = await this._launcher.ensureReady({ wantId: target.wantId, slotRole: target.slotRole, send });
    if (ready.error) return { result: ImageRouter._fail(send, ready.error) };
    ready.server.markActive();
    if (!target.model) return { result: ImageRouter._fail(send, `Image model "${target.wantId}" not found in the models directory.`) };
    const plan = this._planRequest(request, target.model, send);
    send('status', { phase: ImageRouter.RENDERING_PHASE });
    send('meta', ImageRouter._meta(target.wantId, ready.status, plan));
    const result = await this._run(this._localRun({ send, notify, target, ready, plan, startedAt }));
    return { result, server: ready.server, modelId: target.wantId };
  }

  async _resolveTarget(request) {
    const defaults = this._svc.getDefaults();
    const explicitRole = ImageSlotPicker.explicitRole(request.slot);
    const fallbackId = explicitRole === ImageSlotPicker.EDIT ? (defaults.editModelId || defaults.modelId) : defaults.modelId;
    const wantId = ImageModelResolver.idFor(request.modelRef, fallbackId);
    if (!wantId) return { error: 'No image model configured. Pick one in Image Setup.' };
    const model = await this._models.resolve(wantId);
    const role = ImageSlotPicker.requestRole({ explicitRole, model, wantId, defaults });
    return { wantId, model, role, slotRole: ImageSlotPicker.residentSlot(this._svc, role, wantId) };
  }

  _planRequest(request, model, send) {
    const planner = new ImageRequestPlanner({ lorasDir: this._models.lorasDir(), ...(this._presize ? { presize: this._presize } : {}) });
    return planner.plan({ request, model, send });
  }

  _localRun({ send, notify, target, ready, plan, startedAt }) {
    return new LocalImageRun({
      role: target.role,
      send,
      notify,
      adapter: this._createAdapter(ready.status),
      server: ready.server,
      plan,
      wantId: target.wantId,
      cold: ready.cold,
      startedAt,
    });
  }

  _createAdapter(status) {
    const auth = this._svc.getApiKeyForLaunch ? this._svc.getApiKeyForLaunch() : { required: false, key: null };
    return ImageAdapterRegistry.createAdapterFor(
      { id: status.plan && status.plan.runtimeId, protocol: 'sd-cpp-http' },
      { baseUrl: `http://127.0.0.1:${status.port}`, apiKey: auth.required ? auth.key : null },
    );
  }

  async _run(run) {
    this._active = run;
    const result = await run.start();
    if (this._active === run) this._active = null;
    return result;
  }

  static _delivered(result) {
    return !!(result && result.success && Array.isArray(result.images) && result.images.length);
  }

  static _meta(wantId, status, plan) {
    return {
      modelId: wantId,
      runtimeId: status.plan && status.plan.runtimeId,
      port: status.port,
      ...ImageRequestPlanner.metaFields(plan),
    };
  }

  static _fail(send, message) {
    send('error', { message });
    return { success: false, error: message };
  }
}

module.exports = ImageRouter;
