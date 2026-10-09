import RuntimeEnsurer from './RuntimeEnsurer.js';
import ServerStarter from './ServerStarter.js';
import SetupHooks from './SetupHooks.js';
import SetupPipeline from './SetupPipeline.js';
import SetupProgressEvents from './SetupProgressEvents.js';

export default class LlmSetup extends SetupPipeline {
  static FAILURE_MESSAGE = 'Setup failed';

  static MLX_RUNTIME_ID = 'mlx-lm';

  static run(api, opts) {
    return new LlmSetup(api, opts).run();
  }

  constructor(api, opts) {
    super(opts);
    this._api = api;
    this._rec = this._opts.rec;
    this._override = this._opts.override || null;
    this._advanced = this._opts.advanced || '';
  }

  async _execute() {
    const runtimeId = this._isMlx() ? LlmSetup.MLX_RUNTIME_ID : this._rec.runtimeId;
    const runtime = await RuntimeEnsurer.ensure(this._api, runtimeId, this._hooks, this._isMlx());
    if (!runtime.ok) return runtime;
    if (this._hooks.isCanceled()) return this._canceled();
    const download = await this._download();
    if (download.result) return download.result;
    return this._configureAndStart(runtimeId, download.dl);
  }

  _isMlx() {
    return !!(this._override && this._override.mlx);
  }

  async _download() {
    this._hooks.phase('Downloading model…');
    this._hooks.setBar(0, '');
    const dl = await SetupHooks.during((cb) => this._api.onModelEvent(cb), this._modelListener(),
      () => this._api.downloadModel(this._downloadSpec()));
    if (dl && dl.paused) return { result: { ok: false, paused: true } };
    if (this._hooks.isCanceled() || (dl && dl.canceled)) return { result: this._canceled() };
    const failure = SetupPipeline._failure(dl, 'Download failed', true);
    return failure ? { result: failure } : { dl };
  }

  _modelListener() {
    return SetupProgressEvents.modelListener(this._hooks, (e) => {
      if (e.type === 'resume') { this._hooks.sub('Resuming…'); return true; }
      if (e.type === 'paused') { this._hooks.sub('Paused'); return true; }
      return false;
    });
  }

  _downloadSpec() {
    const o = this._override;
    if (o && o.mlx) return { mlx: true, repoId: o.repoId };
    if (o) return { url: o.url, filename: o.file };
    if (this._advanced) return { hf: this._advanced };
    return { url: this._rec.url, filename: this._rec.file };
  }

  async _configureAndStart(runtimeId, dl) {
    this._hooks.phase('Configuring & starting the server…');
    this._hooks.setBar(null, '');
    const rec = this._rec;
    const saved = await this._api.setDefaults({
      runtimeId,
      modelPath: dl.destPath,
      contextSize: rec.contextSize,
      kvCacheType: rec.kvCacheType,
      ...(rec.cpuMoe !== undefined ? { cpuMoe: !!rec.cpuMoe } : {}),
    });
    if (saved && saved.success === false) return { ok: false, message: saved.error || 'Could not save defaults' };
    const started = await ServerStarter.startIdempotent(this._api);
    if (!started.ok) return started;
    return {
      ok: true,
      file: dl.file || (this._override && this._override.file) || rec.file || '',
      destPath: dl.destPath,
      alreadyPresent: !!dl.alreadyPresent,
    };
  }
}
