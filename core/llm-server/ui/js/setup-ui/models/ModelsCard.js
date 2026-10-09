import StatusLine from '../StatusLine.js';
import AddonModels from './AddonModels.js';
import LlmModelRow from './LlmModelRow.js';
import ModelsCardHtml from './ModelsCardHtml.js';
import RuntimeRecommender from './RuntimeRecommender.js';

export default class ModelsCard {
  static LLM_NAMESPACE = 'mlLlmRows';

  static ADDON_NAMESPACE = 'mlLlmAddon';

  constructor(ctx, modelList) {
    this._ctx = ctx;
    this._modelList = modelList;
    this._llmCtl = null;
    this._scaffolded = false;
    this._fitPathByKey = new Map();
    this.addons = new AddonModels(ctx);
    this._rows = new LlmModelRow({
      recommender: new RuntimeRecommender(ctx.runtimes, ctx.hostCaps),
      ctxFit: ctx.ctxFit,
      fitBlock: (path) => ctx.cards.fitTest.view.blockHtml(path),
    });
  }

  async render() {
    const api = this._ctx.api;
    if (!api || !api.getModelsView) { this._error('llmDiagAPI.getModelsView is unavailable.'); return; }
    const [res] = await Promise.all([api.getModelsView(), this._ctx.ctxFit.load()]);
    if (!res || !res.success) { this._error((res && res.error) || 'Failed to load models view'); return; }
    this._ctx.library.scan = res.scan;
    this.renderView(res.config, res.scan);
  }

  renderView(config, scan) {
    const body = this._body();
    if (!this._ensureScaffold(body)) return;
    this._paintPill(scan);
    body.querySelector('[data-ml-chrome="top"]').innerHTML = ModelsCardHtml.controls(config) + ModelsCardHtml.listNote(scan);
    body.querySelector('[data-ml-chrome="list-note"]').innerHTML = '';
    body.querySelector('[data-ml-chrome="bottom"]').innerHTML = ModelsCardHtml.bottom(scan);
    this.updateInstalledSummary();
    this._setRows(scan && scan.available ? (scan.models || []) : []);
    this.addons.render(body);
    this._ctx.cards.fitTest.hydrate();
    this._ctx.cards.gambit.hydrate();
  }

  updateInstalledSummary() {
    const meta = this._ctx.doc.querySelector('#modelsBody [data-ml-chrome="installed-meta"]');
    if (!meta) return;
    const curPath = this._ctx.lastDefaults && this._ctx.lastDefaults.modelPath;
    meta.innerHTML = ModelsCardHtml.installedMeta(this._ctx.library.count(), this._ctx.library.find(curPath));
  }

  async applyDirChange(newDir) {
    const status = StatusLine.for(this._ctx.doc.querySelector('[data-models-status]'), 'path-hint-status');
    status('', 'Saving…');
    const res = await this._ctx.api.setModelsDir(newDir);
    if (!res || !res.success) { status('bad', (res && res.error) || 'Save failed.'); return; }
    status('ok', newDir ? 'Saved' : 'Reverted to default');
    this._ctx.library.scan = res.scan;
    await this._ctx.ctxFit.load();
    this.renderView(res.config, res.scan);
    this._ctx.cards.defaults.render();
  }

  refreshFitSections(htmlFor) {
    if (!this._llmCtl) return;
    this._llmCtl.patchAll((row) => {
      const path = this._fitPathByKey.get(row.mlKey);
      return path ? { fitHtml: htmlFor(path) } : null;
    });
  }

  _ensureScaffold(body) {
    if (this._scaffolded && body.querySelector('[data-ml-mount="llm"]')) return true;
    if (!this._modelList || typeof this._modelList.mount !== 'function') return false;
    body.className = '';
    body.innerHTML = ModelsCardHtml.scaffold();
    this._llmCtl = this._modelList.mount(body.querySelector('[data-ml-mount="llm"]'), ModelsCard.LLM_NAMESPACE, {});
    const addonCtl = this._modelList.mount(body.querySelector('[data-ml-mount="llm-addon"]'), ModelsCard.ADDON_NAMESPACE, {
      onAction: (row, act, e, btn) => this.addons.onAction(row, act, e, btn),
    });
    this.addons.attach(addonCtl);
    this._scaffolded = true;
    return true;
  }

  _setRows(models) {
    this._fitPathByKey.clear();
    for (const m of models) {
      const path = LlmModelRow.weightsPath(m);
      if (path) this._fitPathByKey.set(LlmModelRow.nameKey(m), path);
    }
    if (this._llmCtl) this._llmCtl.set(models.map((m) => this._rows.view(m)));
  }

  _paintPill(scan) {
    const pill = this._ctx.doc.getElementById('modelsPill');
    pill.className = 'luma-badge accent';
    pill.textContent = ModelsCardHtml.pillText(scan);
  }

  _body() {
    return this._ctx.doc.getElementById('modelsBody');
  }

  _error(text) {
    const body = this._body();
    body.className = 'luma-error';
    body.textContent = text;
  }
}
