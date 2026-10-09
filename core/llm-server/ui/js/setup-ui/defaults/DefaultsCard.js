import DefaultsCardHtml from './DefaultsCardHtml.js';
import DefaultsForm from './DefaultsForm.js';
import DefaultsOptions from './DefaultsOptions.js';
import DefaultsPrefs from './DefaultsPrefs.js';
import DefaultsRows from './DefaultsRows.js';
import GroupRouterHint from './GroupRouterHint.js';
import ModelLibrary from '../models/ModelLibrary.js';
import PeerGpusHint from './PeerGpusHint.js';
import RamPinHint from './RamPinHint.js';

export default class DefaultsCard {
  static SAVE_NOTE_MS = 4000;

  static SHARED_CONTROLS = ['defaultRuntimeSelect', 'defaultModelSelect', 'defaultContextSelect', 'defaultKvSelect',
    'defaultParallelSelect', 'defaultTensorSplit', 'defaultCacheReuse', 'defaultReasoningEffort', 'defaultUsePeerGpus',
    'defaultLaunchFlags', 'defaultRamPin', 'defaultGroupRouter', 'defaultGroupRouterPin'];

  constructor(ctx) {
    this._ctx = ctx;
    this.rows = new DefaultsRows();
    this.prefs = new DefaultsPrefs();
    this._ramPinHint = new RamPinHint(ctx, this.prefs);
    this._routerHint = new GroupRouterHint(ctx);
    this._autoPinInFlight = null;
    this._saveNoteTimer = null;
  }

  async render() {
    const api = this._ctx.api;
    if (!api || !api.getDefaults) { this._error('Defaults API not available.'); return; }
    const defaults = await api.getDefaults();
    await this._ensureScan();
    await this.prefs.load(api);
    this.renderView(defaults);
  }

  renderView(defaults) {
    this._ctx.lastDefaults = defaults;
    const view = this._view(defaults);
    this._paintPill(view.ready);
    const body = this._body();
    body.className = '';
    body.innerHTML = DefaultsCardHtml.html(this.rows, view);
    this._wire();
    this._ctx.cards.fitTest.refresh();
    this._ctx.cards.models.updateInstalledSummary();
  }

  async onChange() {
    const res = await this._ctx.api.setDefaults(DefaultsForm.read(this._ctx.doc));
    if (!(res && res.success)) return;
    this.renderView(res.defaults);
    this.showSaveNote(!!res.serverStopped);
  }

  showSaveNote(serverStopped) {
    const doc = this._ctx.doc;
    const body = this._body();
    if (!body) return;
    const old = doc.getElementById('defaultsSaveNote');
    if (old) old.remove();
    if (this._saveNoteTimer) { clearTimeout(this._saveNoteTimer); this._saveNoteTimer = null; }
    const note = doc.createElement('div');
    note.id = 'defaultsSaveNote';
    note.className = 'defaults-save-note' + (serverStopped ? ' stopped' : '');
    note.textContent = serverStopped
      ? 'Saved. The running model was stopped so the new settings can apply; it relaunches automatically on your next chat message.'
      : 'Saved.';
    body.prepend(note);
    if (!serverStopped) this._saveNoteTimer = setTimeout(() => { note.remove(); this._saveNoteTimer = null; }, DefaultsCard.SAVE_NOTE_MS);
  }

  _view(defaults) {
    const ctx = this._ctx;
    const runtimes = ctx.runtimes.installedInference();
    const scoped = ModelLibrary.forRuntime(ctx.library.choices(), defaults.runtimeId, ctx.runtimes);
    const modelPath = this._autoPin(defaults, scoped);
    const hasRuntime = runtimes.length > 0;
    const hasModel = scoped.models.length > 0;
    const ready = hasRuntime && hasModel && !!(defaults.runtimeId && modelPath);
    return {
      defaults,
      prefs: this.prefs,
      runtimeOptions: DefaultsOptions.runtimeOptionsHtml(runtimes, defaults.runtimeId),
      modelOptions: DefaultsOptions.modelOptionsHtml(scoped, modelPath, (path) => ctx.ctxFit.summary(path)),
      lockModel: scoped.locked,
      hasRuntime,
      hasModel,
      ready,
      routerAvailable: !!ctx.api.getGroupRouterStatus,
      gambitSummary: ctx.cards.gambit.summaryHtml(),
      gambitBlock: ctx.cards.gambit.blockHtml(),
    };
  }

  _autoPin(defaults, scoped) {
    if (!scoped.locked || defaults.modelPath === scoped.models[0].path) return defaults.modelPath;
    const path = scoped.models[0].path;
    const api = this._ctx.api;
    if (this._autoPinInFlight !== path && api && api.setDefaults) {
      this._autoPinInFlight = path;
      api.setDefaults({ modelPath: path }).then((res) => {
        this._autoPinInFlight = null;
        if (res && res.success) this.renderView(res.defaults);
      }).catch(() => { this._autoPinInFlight = null; });
    }
    return path;
  }

  async _ensureScan() {
    if (this._ctx.library.scan) return;
    try {
      const r = await this._ctx.api.getModelsView();
      if (r && r.success) this._ctx.library.scan = r.scan;
    } catch (_) {}
  }

  _wire() {
    const doc = this._ctx.doc;
    for (const id of DefaultsCard.SHARED_CONTROLS) {
      const el = doc.getElementById(id);
      if (el) el.addEventListener('change', () => this.onChange());
    }
    this._ramPinHint.refresh();
    this._routerHint.refresh();
    PeerGpusHint.fill(this._ctx.api, doc);
    this._wireOwnSaves();
  }

  _wireOwnSaves() {
    const api = this._ctx.api;
    const doc = this._ctx.doc;
    const pressure = doc.getElementById('defaultUnloadOnVramPressure');
    if (pressure && api.setUnloadOnVramPressure) {
      pressure.addEventListener('change', async () => {
        this.prefs.unloadOnVramPressure = !!pressure.checked;
        try { await api.setUnloadOnVramPressure(this.prefs.unloadOnVramPressure); } catch (_) {}
        this.renderView(this._ctx.lastDefaults);
      });
    }
    const autoUnload = doc.getElementById('defaultAutoUnload');
    if (autoUnload && api.setAutoUnloadMs) {
      autoUnload.addEventListener('change', async () => {
        this.prefs.autoUnloadMs = autoUnload.checked ? DefaultsPrefs.AUTO_UNLOAD_MS : 0;
        try { await api.setAutoUnloadMs(this.prefs.autoUnloadMs); } catch (_) {}
        this.renderView(this._ctx.lastDefaults);
      });
    }
    const approval = doc.getElementById('defaultToolApproval');
    if (approval && api.setApprovalPolicy) {
      approval.addEventListener('change', async () => {
        this.prefs.approvalPolicy = approval.value;
        try {
          await api.setApprovalPolicy(approval.value);
          this.renderView(this._ctx.lastDefaults);
          this.showSaveNote(false);
        } catch (_) {}
      });
    }
  }

  _paintPill(ready) {
    const pill = this._ctx.doc.getElementById('defaultsPill');
    pill.className = 'luma-badge ' + (ready ? 'ok' : 'warn');
    pill.textContent = ready ? 'ready' : 'set defaults to enable chat';
  }

  _body() {
    return this._ctx.doc.getElementById('defaultsBody');
  }

  _error(text) {
    const body = this._body();
    body.className = 'luma-error';
    body.textContent = text;
  }
}
