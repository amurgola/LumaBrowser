import DefaultModelServing from './DefaultModelServing.js';
import DefaultsCardHtml from './DefaultsCardHtml.js';
import DefaultsForm from './DefaultsForm.js';
import DefaultsOptions from './DefaultsOptions.js';
import DefaultsPrefs from './DefaultsPrefs.js';
import GroupRouterHint from './GroupRouterHint.js';
import HelperModelHint from './HelperModelHint.js';
import SaveNote from './SaveNote.js';

export default class DefaultsCard {
  static SHARED_CONTROLS = ['defaultModelSelect', 'defaultContextSelect', 'defaultReasoningEffort', 'defaultGroupRouter',
    'defaultGroupRouterPin', 'defaultHelperModel', 'defaultHelperModelSelect', 'defaultHelperContext'];

  constructor(ctx) {
    this._ctx = ctx;
    this.rows = ctx.rows;
    this.prefs = ctx.prefs;
    this._routerHint = new GroupRouterHint(ctx);
    this._helperHint = new HelperModelHint(ctx);
    this._saveNote = new SaveNote(ctx.doc, { noteId: 'defaultsSaveNote', bodyId: 'defaultsBody', pillId: 'defaultsPill' });
    this._renderedForm = null;
    this._followOutsideChanges();
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
    this._paintPill(view);
    const body = this._body();
    body.className = '';
    body.innerHTML = DefaultsCardHtml.html(this.rows, view);
    this._wire();
    this._ctx.cards.fitTest.refresh();
    this._ctx.cards.models.updateInstalledSummary();
    const runtimes = this._ctx.cards.runtimes;
    if (runtimes && typeof runtimes.publishStatus === 'function') runtimes.publishStatus();
  }

  async onChange() {
    const patch = DefaultsForm.changes(this._renderedForm, DefaultsForm.read(this._ctx.doc));
    if (!Object.keys(patch).length) return;
    const res = await this._ctx.api.setDefaults(patch);
    if (!(res && res.success)) return;
    if ('modelPath' in patch) await this._refreshFrameworks();
    this.renderView(res.defaults);
    this.showSaveNote(!!res.serverStopped);
  }

  showSaveNote(serverStopped) {
    this._saveNote.show(serverStopped);
  }

  _view(defaults) {
    const ctx = this._ctx;
    const models = ctx.library.choices();
    const fit = (path) => ctx.ctxFit.summary(path);
    const serving = DefaultModelServing.of(defaults, ctx.frameworks, ctx.runtimes);
    return {
      defaults,
      prefs: this.prefs,
      modelOptions: DefaultsOptions.modelOptionsHtml({ models }, defaults.modelPath, fit),
      hasModel: models.length > 0,
      runsOn: serving.runsOn,
      ready: !!(defaults.modelPath && serving.runtimeId),
      routerAvailable: !!ctx.api.getGroupRouterStatus,
      helperAvailable: !!ctx.api.getHelperModelStatus,
      helperModelOptions: DefaultsOptions.modelOptionsHtml({ models }, (defaults.helperModel && defaults.helperModel.modelPath) || '', fit),
    };
  }

  async _ensureScan() {
    if (this._ctx.library.scan) return;
    try {
      const r = await this._ctx.api.getModelsView();
      if (r && r.success) this._ctx.library.scan = r.scan;
    } catch (_) {}
  }

  _followOutsideChanges() {
    const api = this._ctx.api;
    if (!api || typeof api.onServerEvent !== 'function') return;
    api.onServerEvent(async (event) => {
      if (!event || event.type !== 'defaults-changed' || !this._ctx.lastDefaults) return;
      const defaults = event.payload && event.payload.defaults;
      if (!defaults) return;
      const servingChanged = await this._refreshFrameworks();
      if (!servingChanged && JSON.stringify(defaults) === JSON.stringify(this._ctx.lastDefaults)) return;
      this.renderView(defaults);
    });
  }

  async _refreshFrameworks() {
    const runtimes = this._ctx.cards.runtimes;
    if (!runtimes || typeof runtimes.refreshFrameworks !== 'function') return false;
    try { return await runtimes.refreshFrameworks(); } catch (_) { return false; }
  }

  _wire() {
    const doc = this._ctx.doc;
    for (const id of DefaultsCard.SHARED_CONTROLS) {
      const el = doc.getElementById(id);
      if (el) el.addEventListener('change', () => this.onChange());
    }
    this._routerHint.refresh();
    this._helperHint.refresh();
    this._wireOwnSaves();
    this._renderedForm = DefaultsForm.read(doc);
  }

  _wireOwnSaves() {
    const api = this._ctx.api;
    const doc = this._ctx.doc;
    const warning = doc.getElementById('defaultVramWarning');
    if (warning && api.setVramWarning) {
      warning.addEventListener('change', async () => {
        this.prefs.vramWarning = !!warning.checked;
        try { await api.setVramWarning(this.prefs.vramWarning); } catch (_) {}
        this.renderView(this._ctx.lastDefaults);
      });
    }
    const pressure = doc.getElementById('defaultUnloadOnVramPressure');
    if (pressure && api.setUnloadOnVramPressure) {
      pressure.addEventListener('change', async () => {
        this.prefs.unloadOnVramPressure = !!pressure.checked;
        try { await api.setUnloadOnVramPressure(this.prefs.unloadOnVramPressure); } catch (_) {}
        this.renderView(this._ctx.lastDefaults);
      });
    }
    const headroom = doc.getElementById('defaultGpuHeadroom');
    if (headroom && api.setGpuHeadroom) {
      headroom.addEventListener('change', async () => {
        const gib = Number(headroom.value);
        if (!(gib > 0)) return;
        try {
          const r = await api.setGpuHeadroom(gib * DefaultsOptions.GIB);
          if (r && r.success) this.prefs.gpuHeadroomBytes = Number(r.bytes);
        } catch (_) {}
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

  _paintPill(view) {
    const pill = this._ctx.doc.getElementById('defaultsPill');
    pill.className = 'luma-badge ' + (view.ready ? 'ok' : 'warn');
    if (view.ready) pill.textContent = 'Ready';
    else pill.textContent = view.runsOn && view.runsOn.missing ? 'Framework not installed' : 'Set defaults to enable chat';
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
