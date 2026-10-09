import ComposerView from './ComposerView.js';
import ContextOptionText from './ContextOptionText.js';
import PopoverFit from '../common/PopoverFit.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ModelPicker {
  static MIN_POP = 220;

  constructor(ctx) {
    this._ctx = ctx;
  }

  async refresh() {
    const { api } = this._ctx;
    try {
      const r = await api.listModels();
      if (r && r.success) this._applyList(r);
    } catch (_) {}
    this.loadLocal();
    this.renderPill();
  }

  async loadLocal() {
    const { api, state } = this._ctx;
    if (!api.getLocalModelOptions) return;
    try {
      const r = await api.getLocalModelOptions();
      if (!(r && r.success)) return;
      state.localModels = r.models || [];
      if (r.currentModelPath && r.currentContext) {
        const cur = state.localModels.find((m) => m.path === r.currentModelPath);
        if (cur && state.ctxByRef[cur.ref] == null) state.ctxByRef[cur.ref] = r.currentContext;
      }
      this.renderPill();
    } catch (_) {}
  }

  renderPill() {
    const label = this.currentLabel();
    this._ctx.root.querySelectorAll('.cm-model-pill b').forEach((b) => { b.textContent = label; });
    this._ctx.thinkPill.syncToModel();
  }

  currentLabel() {
    const { state } = this._ctx;
    const lm = this._selectedLocal();
    if (lm) {
      const t = this.chosenCtx(lm);
      return 'Local · ' + (lm.displayName || lm.name) + (t ? ' · ' + ContextOptionText.ctxLabel(t) : '');
    }
    const m = state.models.find((x) => x.ref === state.modelRef);
    if (m) return m.label;
    return state.modelRef || 'No model';
  }

  chosenCtx(model) {
    const v = this._ctx.state.ctxByRef[model.ref];
    return v != null ? v : (model.recommendedTokens || null);
  }

  activeCtxWindow() {
    const { state } = this._ctx;
    if (state.lastUsage && state.lastUsage.window) return state.lastUsage.window;
    const lm = this._selectedLocal();
    return lm ? (this.chosenCtx(lm) || null) : null;
  }

  selectLocal(model, tokens) {
    const { api, state } = this._ctx;
    state.modelRef = model.ref;
    if (tokens) state.ctxByRef[model.ref] = tokens;
    try { api.setDefaults({ modelPath: model.path, contextSize: tokens || this.chosenCtx(model) || null }); } catch (_) {}
    try { api.setLastModelRef(model.ref); } catch (_) {}
    this.renderPill();
    this._ctx.popovers.closeAll();
  }

  selectRemote(m) {
    this._ctx.state.modelRef = m.ref;
    try { this._ctx.api.setLastModelRef(m.ref); } catch (_) {}
    this.renderPill();
    this._ctx.popovers.closeAll();
  }

  openPicker(anchor, refresh) {
    this._ctx.popovers.closeAll();
    const pop = Dom.el('div', 'cm-model-pop');
    this._appendLocal(pop);
    this._appendGroups(pop);
    if (!pop.querySelector('.cm-model-opt')) return;
    anchor.appendChild(pop);
    PopoverFit.fitScrolling(pop, this._ctx.root, ModelPicker.MIN_POP);
    if (refresh) this.loadLocal();
    this._ctx.popovers.arm();
  }

  _applyList(r) {
    const { state } = this._ctx;
    state.models = r.models || [];
    state.defaultRef = r.defaultRef || null;
    if (!state.modelRef || !state.models.some((m) => m.ref === state.modelRef)) {
      state.modelRef = state.defaultRef || (state.models[0] && state.models[0].ref) || null;
    }
    if (state.models.length) this._ctx.availability.set(true, '');
    else this._ctx.availability.set(false, ComposerView.NO_MODEL);
  }

  _selectedLocal() {
    const { state } = this._ctx;
    return state.localModels.find((m) => m.ref === state.modelRef);
  }

  _appendLocal(pop) {
    const { state } = this._ctx;
    if (!state.localModels.length) return;
    const esc = HtmlEscaper.escape;
    pop.appendChild(Dom.el('div', 'cm-model-group', 'Local'));
    for (const m of state.localModels) {
      const head = Dom.el('div', 'cm-model-opt cm-local-head' + (m.ref === state.modelRef ? ' sel' : ''),
        '<div class="cm-local-name">' + esc(m.displayName || m.name) + '</div>'
        + '<div class="cm-model-sub">' + esc(m.summary)
        + (m.hasFit ? '' : ' · <span class="cm-est-tag">estimated</span>') + '</div>');
      head.addEventListener('click', () => this.selectLocal(m, this.chosenCtx(m)));
      pop.appendChild(head);
      const row = Dom.el('div', 'cm-ctx-row');
      for (const opt of (m.contextOptions || [])) row.appendChild(this._ctxChip(m, opt));
      pop.appendChild(row);
    }
  }

  _appendGroups(pop) {
    const { state } = this._ctx;
    const groups = {};
    for (const m of state.models) {
      if (m.isLocal) continue;
      const g = m.providerType === 'anthropic' ? 'Anthropic' : 'Providers';
      (groups[g] = groups[g] || []).push(m);
    }
    if (!state.localModels.length) {
      for (const m of state.models) {
        if (m.isLocal) (groups.Local = groups.Local || []).unshift(m);
      }
    }
    for (const g of Object.keys(groups)) {
      pop.appendChild(Dom.el('div', 'cm-model-group', HtmlEscaper.escape(g)));
      for (const m of groups[g]) pop.appendChild(this._remoteOption(m));
    }
  }

  _remoteOption(m) {
    const o = Dom.el('div', 'cm-model-opt' + (m.ref === this._ctx.state.modelRef ? ' sel' : ''),
      '<span class="cm-dot' + (m.ready ? ' ready' : '') + '"></span>' + HtmlEscaper.escape(m.label));
    o.addEventListener('click', () => this.selectRemote(m));
    return o;
  }

  _ctxChip(model, opt) {
    const spec = ContextOptionText.chip(opt, this.chosenCtx(model) === opt.tokens);
    const chip = Dom.el('button', spec.cls.join(' '), HtmlEscaper.escape(spec.text));
    chip.title = spec.tip;
    chip.addEventListener('click', (e) => { e.stopPropagation(); this.selectLocal(model, opt.tokens); });
    return chip;
  }
}
