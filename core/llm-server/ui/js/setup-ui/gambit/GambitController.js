import GambitState from './GambitState.js';
import GambitView from './GambitView.js';

export default class GambitController {
  static RAW_URL_TTL_MS = 5000;

  constructor(ctx, fitState) {
    this._ctx = ctx;
    this._fitState = fitState;
    this.state = new GambitState();
    this.view = new GambitView(this.state, () => fitState.busy);
    this._eventsBound = false;
  }

  currentPath() {
    return (this._ctx.lastDefaults && this._ctx.lastDefaults.modelPath) || null;
  }

  blockHtml() {
    return this.view.blockHtml(this.currentPath());
  }

  summaryHtml() {
    return this.view.summaryHtml(this.currentPath());
  }

  refresh() {
    const doc = this._ctx.doc;
    const block = doc.getElementById('gambitBlock');
    if (!block) return;
    block.innerHTML = this.view.contentHtml(this.currentPath());
    const meta = doc.getElementById('gambitSummaryMeta');
    if (meta) meta.innerHTML = this.summaryHtml();
  }

  bindEvents() {
    const api = this._ctx.api;
    if (this._eventsBound || !api || !api.onGambitEvent) return;
    this._eventsBound = true;
    api.onGambitEvent(({ type, payload }) => {
      if (this.state.applyEvent(type, payload)) this.refresh();
    });
  }

  async start(path) {
    const api = this._ctx.api;
    if (this.state.busy || this._fitState.busy || !path || !api || !api.runGambit) return;
    this.state.begin(path);
    this.refresh();
    try {
      this.state.reconcile(path, await api.runGambit(path));
    } catch (err) {
      this.state.fail(path, (err && err.message) || 'The gambit failed.');
    }
    this.refresh();
  }

  async cancel() {
    const api = this._ctx.api;
    if (!api || !api.cancelGambit) return;
    try { await api.cancelGambit(); } catch (_) {}
  }

  async downloadRaw(path) {
    const api = this._ctx.api;
    if (!api || !api.getGambitRaw) return;
    this.state.ensure(path);
    let res;
    try { res = await api.getGambitRaw(); } catch (err) {
      res = { success: false, error: (err && err.message) || 'download failed' };
    }
    if (!res || !res.success) {
      this.state.rawUnavailable(path, (res && res.error) || 'Raw results are no longer available.');
      this.refresh();
      return;
    }
    try { this._saveJson(res.raw); } catch (err) {
      this.state.ensure(path).error = (err && err.message) || 'Could not build the download.';
      this.refresh();
    }
  }

  async hydrate() {
    const api = this._ctx.api;
    if (!api) return;
    try {
      const stat = api.getGambitStatus ? await api.getGambitStatus() : null;
      if (stat && stat.success && stat.running && stat.live) this.state.adoptLive(stat.live);
    } catch (_) {}
    try {
      const r = api.getGambitResults ? await api.getGambitResults() : null;
      if (r && r.success && r.results) this.state.adoptStored(r.results);
    } catch (_) {}
    this.refresh();
  }

  static fileName(raw) {
    const stamp = String(raw.ranAt || '').replace(/[:.]/g, '-') || 'run';
    return `gambit-${stamp}.json`;
  }

  _saveJson(raw) {
    const doc = this._ctx.doc;
    const win = this._ctx.win;
    const url = win.URL.createObjectURL(new win.Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' }));
    const a = doc.createElement('a');
    a.href = url;
    a.download = GambitController.fileName(raw);
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => win.URL.revokeObjectURL(url), GambitController.RAW_URL_TTL_MS);
  }
}
