import ApiSecurityCard from './ApiSecurityCard.js';
import DiagnosticsCache from './DiagnosticsCache.js';
import DiagnosticsPainter from './DiagnosticsPainter.js';

export default class DiagnosticsLoader {
  static CARD_BODIES = ['memBody', 'cpuBody', 'gpuBody', 'cudaBody', 'diskBody', 'budgetBody', 'runtimesBody', 'modelsBody'];

  static LOADING_HTML = '<span class="card-loading"><span class="luma-spinner"></span>Loading…</span>';

  static NO_API = 'llmDiagAPI not exposed: the preload script failed to load.';

  constructor(ctx) {
    this._ctx = ctx;
    this._painted = false;
  }

  async load(opts) {
    const force = !!(opts && opts.force);
    this._paintCached();
    this._showSpinners();
    this._hostMeta(force);
    const api = this._ctx.api;
    if (!api) { this._failAll(DiagnosticsLoader.NO_API); return; }
    const res = await api.getDiagnostics({ force });
    if (!res || !res.success) { this._failAll((res && res.error) || 'Diagnostics request failed'); return; }
    this._paintFresh(res.data);
    await this._renderCards();
  }

  _paintCached() {
    if (this._painted) return;
    const cached = DiagnosticsCache.read(this._ctx.win.localStorage);
    if (!cached) return;
    try { DiagnosticsPainter.paint(this._ctx.doc, cached); this._painted = true; } catch (_) { this._painted = false; }
  }

  _showSpinners() {
    for (const id of DiagnosticsLoader.CARD_BODIES) {
      const el = this._ctx.doc.getElementById(id);
      if (this._painted && el.className !== 'luma-muted') continue;
      el.className = 'luma-muted';
      el.innerHTML = DiagnosticsLoader.LOADING_HTML;
    }
  }

  _hostMeta(force) {
    const meta = this._ctx.doc.getElementById('hostMeta');
    if (force) meta.textContent = 'Re-probing host…';
    else if (!this._painted) meta.textContent = 'Probing host…';
  }

  _failAll(message) {
    for (const id of DiagnosticsLoader.CARD_BODIES) {
      const el = this._ctx.doc.getElementById(id);
      el.className = 'luma-error';
      el.textContent = message;
    }
  }

  _paintFresh(data) {
    DiagnosticsPainter.paint(this._ctx.doc, data);
    this._painted = true;
    DiagnosticsCache.write(data, this._ctx.win.localStorage);
    this._ctx.hostCaps.update(data);
  }

  async _renderCards() {
    const cards = this._ctx.cards;
    await cards.runtimes.render();
    await cards.models.render();
    await cards.defaults.render();
    ApiSecurityCard.render(this._ctx.doc, this._ctx.api.apiSecurity).catch(() => {});
    cards.plan.refresh().catch(() => {});
  }
}
