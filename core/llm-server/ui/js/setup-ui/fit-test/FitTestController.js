import FitTestState from './FitTestState.js';
import FitTestView from './FitTestView.js';

export default class FitTestController {
  constructor(ctx) {
    this._ctx = ctx;
    this.state = new FitTestState();
    this.view = new FitTestView(this.state, () => ctx.lastDefaults);
    this._eventsBound = false;
  }

  bindEvents() {
    const api = this._ctx.api;
    if (this._eventsBound || !api || !api.onFitTestEvent) return;
    this._eventsBound = true;
    api.onFitTestEvent(({ type, payload }) => {
      if (this.state.applyEvent(type, payload)) this.refresh();
    });
  }

  refresh() {
    this._ctx.cards.models.refreshFitSections((path) => this.view.blockHtml(path));
  }

  async start(path) {
    const api = this._ctx.api;
    if (this.state.busy || !path || !api || !api.runFitTest) return;
    this.state.begin(path);
    this.refresh();
    try {
      const res = await api.runFitTest(path);
      if (this.state.reconcile(path, res)) this.refresh();
    } catch (err) {
      this.state.fail(path, err && err.message ? err.message : 'Fit test failed.');
      this.refresh();
    }
  }

  async cancel() {
    const api = this._ctx.api;
    if (!api || !api.cancelFitTest) return;
    try { await api.cancelFitTest(); } catch (_) {}
  }

  async use(path, ctx, kv) {
    const st = this.state.get(path);
    const payload = { modelPath: path, contextSize: ctx, kvCacheType: kv };
    if (st && st.runtime && st.runtime.id) payload.runtimeId = st.runtime.id;
    const res = await this._ctx.api.setDefaults(payload);
    if (!(res && res.success)) return;
    this._ctx.lastDefaults = res.defaults;
    this.refresh();
    await this._ctx.cards.defaults.render();
    this._ctx.cards.defaults.showSaveNote(!!res.serverStopped);
  }

  async hydrate() {
    const api = this._ctx.api;
    if (!api) return;
    try {
      const stat = api.getFitTestStatus ? await api.getFitTestStatus() : null;
      if (stat && stat.success && stat.running && stat.live) this.state.adoptLive(stat.live);
    } catch (_) {}
    try {
      const r = api.getFitResults ? await api.getFitResults() : null;
      if (r && r.success && r.results) this.state.adoptStored(r.results);
    } catch (_) {}
    this.refresh();
  }
}
