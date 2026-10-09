import RuntimeEnsurer from './RuntimeEnsurer.js';
import ServerStarter from './ServerStarter.js';
import SetupPipeline from './SetupPipeline.js';

export default class ImportSetup extends SetupPipeline {
  static FAILURE_MESSAGE = 'Import failed';

  static run(api, opts) {
    return new ImportSetup(api, opts).run();
  }

  constructor(api, opts) {
    super(opts);
    this._api = api;
    this._found = this._opts.found;
  }

  _validate() {
    if (!this._found || !this._found.path) return { ok: false, message: 'No model selected to import.' };
    return null;
  }

  async _execute() {
    const runtime = await RuntimeEnsurer.ensure(this._api, this._opts.runtimeId, this._hooks, false);
    if (!runtime.ok) return runtime;
    if (this._hooks.isCanceled()) return this._canceled();
    const imported = await this._import();
    if (!imported || !imported.success) return { ok: false, message: (imported && imported.error) || 'Could not add that model.' };
    return this._configureAndStart(imported);
  }

  _import() {
    const found = this._found;
    this._hooks.phase('Adding your existing model…');
    this._hooks.setBar(null, found.name || found.file || '');
    return this._api.importExistingModel({ sourcePath: found.path, fileName: found.file });
  }

  async _configureAndStart(imported) {
    const o = this._opts;
    this._hooks.phase('Configuring & starting the server…');
    this._hooks.setBar(null, '');
    const saved = await this._api.setDefaults({
      runtimeId: o.runtimeId,
      modelPath: imported.destPath,
      ...(o.contextSize ? { contextSize: o.contextSize } : {}),
      ...(o.kvCacheType ? { kvCacheType: o.kvCacheType } : {}),
    });
    if (saved && saved.success === false) return { ok: false, message: saved.error || 'Could not save defaults' };
    const started = await ServerStarter.startIdempotent(this._api);
    if (!started.ok) return started;
    return { ok: true, file: this._found.file || '', destPath: imported.destPath, imported: true, mode: imported.mode };
  }
}
