import SetupHooks from './SetupHooks.js';
import SetupPipeline from './SetupPipeline.js';
import SetupProgressEvents from './SetupProgressEvents.js';

export default class MusicSetup extends SetupPipeline {
  static FAILURE_MESSAGE = 'Music setup failed';

  static run(api, opts) {
    return new MusicSetup(api, opts).run();
  }

  constructor(api, opts) {
    super(opts);
    this._api = api;
    this._leg = this._opts.plan;
  }

  _validate() {
    if (!this._api || !this._leg || !this._leg.modelId) return { ok: false, message: 'No music setup plan available.' };
    return null;
  }

  async _execute() {
    const runtime = await this._ensureRuntime();
    if (runtime) return runtime;
    if (this._hooks.isCanceled()) return this._canceled();
    const download = await this._download();
    if (download) return download;
    return this._configure();
  }

  async _ensureRuntime() {
    this._hooks.phase('Checking music runtime…');
    this._hooks.setBar(null);
    const row = await this._runtimeRow();
    if (!row) return { ok: false, message: 'Music runtime unavailable on this host.' };
    if (row.installed) return null;
    this._hooks.phase('Installing SGLang-Omni (Python environment)…');
    const listener = SetupProgressEvents.runtimeListener(this._hooks, { installPhase: true });
    const installed = await SetupHooks.during((cb) => this._api.onRuntimeEvent(cb), listener,
      () => this._api.installRuntime(row.id));
    return SetupPipeline._failure(installed, 'Music runtime install failed', false);
  }

  async _runtimeRow() {
    let view;
    try { view = await this._api.getView(); } catch (_) { view = null; }
    return view && view.runtimes && view.runtimes.runtimes && view.runtimes.runtimes[0];
  }

  async _download() {
    this._hooks.phase('Downloading the music model…');
    this._hooks.setBar(0, '');
    const dl = await SetupHooks.during((cb) => this._api.onModelEvent(cb), SetupProgressEvents.modelListener(this._hooks),
      () => this._api.downloadModel(this._leg.modelId));
    if (this._hooks.isCanceled() || (dl && dl.canceled)) return this._canceled();
    return SetupPipeline._failure(dl, 'Music model download failed', false);
  }

  async _configure() {
    this._hooks.phase('Configuring music generation…');
    this._hooks.setBar(null, '');
    const saved = await this._api.setDefaults({ modelId: this._leg.modelId });
    if (saved && saved.success === false) return { ok: false, message: saved.error || 'Could not save music defaults' };
    try { await this._api.setEnabled(true); } catch (_) {}
    return { ok: true };
  }
}
