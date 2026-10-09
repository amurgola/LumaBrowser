import SetupHooks from './SetupHooks.js';
import SetupPipeline from './SetupPipeline.js';
import SetupProgressEvents from './SetupProgressEvents.js';

export default class ImageSetup extends SetupPipeline {
  static FAILURE_MESSAGE = 'Image setup failed';

  static run(api, opts) {
    return new ImageSetup(api, opts).run();
  }

  constructor(api, opts) {
    super(opts);
    this._api = api;
    this._runtime = this._opts.runtime;
    this._found = this._opts.found || null;
    this._model = this._opts.model;
  }

  _validate() {
    if (!this._runtime || (!this._model && !this._found)) {
      return { ok: false, message: 'No image runtime or model resolved for this host.' };
    }
    return null;
  }

  async _execute() {
    const runtime = await this._ensureRuntime();
    if (runtime) return runtime;
    if (this._hooks.isCanceled()) return this._canceled();
    const model = this._found ? await this._link() : await this._download();
    if (model.result) return model.result;
    return this._configureAndStart(model.modelId);
  }

  async _ensureRuntime() {
    this._hooks.phase('Checking image runtime…');
    this._hooks.setBar(null);
    if (this._runtime.installed) return null;
    this._hooks.phase('Installing ' + (this._runtime.name || 'image runtime') + '…');
    const listener = SetupProgressEvents.runtimeListener(this._hooks, { companionPrefix: true });
    const installed = await SetupHooks.during((cb) => this._api.onRuntimeEvent(cb), listener,
      () => this._api.installRuntime(this._runtime.id));
    return SetupPipeline._failure(installed, 'Runtime install failed', false);
  }

  async _link() {
    const found = this._found;
    this._hooks.phase('Adding your existing model…');
    this._hooks.setBar(null, found.name || found.file || '');
    const imported = await this._api.importExistingModel({ sourcePath: found.path, name: found.name, promptStyle: found.promptStyle });
    if (!imported || !imported.success) return { result: { ok: false, message: (imported && imported.error) || 'Could not add that model.' } };
    return { modelId: imported.id };
  }

  async _download() {
    this._hooks.phase('Downloading model…');
    this._hooks.setBar(0, '');
    const dl = await SetupHooks.during((cb) => this._api.onModelEvent(cb), this._modelListener(),
      () => this._api.downloadModel({ id: this._model.id }));
    if (this._hooks.isCanceled() || (dl && dl.canceled)) return { result: this._canceled() };
    const failure = SetupPipeline._failure(dl, 'Download failed', false);
    return failure ? { result: failure } : { modelId: this._model.id };
  }

  _modelListener() {
    return SetupProgressEvents.modelListener(this._hooks, (e) => {
      if (e.type !== 'file-start' || !e.payload) return false;
      const role = e.payload.role ? ' · ' + e.payload.role : '';
      this._hooks.sub('File ' + ((e.payload.index || 0) + 1) + ' of ' + (e.payload.total || 1) + role);
      this._hooks.setBar(0);
      return true;
    });
  }

  async _configureAndStart(modelId) {
    this._hooks.phase('Configuring & starting the image server…');
    this._hooks.setBar(null, '');
    const saved = await this._api.setDefaults({ runtimeId: this._runtime.id, modelId });
    if (saved && saved.success === false) return { ok: false, message: saved.error || 'Could not save image defaults' };
    try { await this._api.setEnabled(true); } catch (_) {}
    const started = await this._api.startServer();
    if (started && started.success === false) return { ok: false, message: (started && started.error) || 'Image server failed to start' };
    return { ok: true, modelId, imported: !!this._found };
  }
}
