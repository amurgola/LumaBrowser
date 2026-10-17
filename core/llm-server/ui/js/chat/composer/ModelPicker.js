import ComposerView from './ComposerView.js';
import ContextOptionText from './ContextOptionText.js';
import ModelTunePanel from './ModelTunePanel.js';
import ChatIcons from '../ChatIcons.js';
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
    this._renderLandingContext(label);
    this._ctx.thinkPill.syncToModel();
  }

  _renderLandingContext(label) {
    const { state, root } = this._ctx;
    const lm = this._selectedLocal();
    const known = !!(lm || state.modelRef);
    root.querySelectorAll('[data-cm-landing-context]').forEach((el) => {
      el.textContent = '';
      if (!known) return;
      const b = document.createElement('b');
      b.textContent = lm ? (lm.displayName || lm.name) : label;
      if (lm) el.append(b, ' runs on this machine. Nothing you type leaves it.');
      else el.append('Chatting with ', b, '.');
    });
  }

  currentLabel() {
    const { state } = this._ctx;
    const lm = this._selectedLocal();
    if (lm) {
      const t = this.chosenCtx(lm);
      const profile = this._selectedProfile();
      return 'Local · ' + (lm.displayName || lm.name) + (profile ? ' · ' + profile.profileName : '')
        + (t ? ' · ' + ContextOptionText.ctxLabel(t) : '');
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

  selectProfile(row) {
    const { api, state } = this._ctx;
    const base = row.isLocal ? state.localModels.find((m) => m.ref === row.baseRef) : null;
    state.modelRef = row.ref;
    if (base) {
      try { api.setDefaults({ modelPath: base.path, contextSize: this.chosenCtx(base) || null }); } catch (_) {}
    }
    try { api.setLastModelRef(row.ref); } catch (_) {}
    this.renderPill();
    this._ctx.popovers.closeAll();
  }

  selectRef(ref) {
    const { state } = this._ctx;
    const local = state.localModels.find((m) => m.ref === ref);
    if (local) { this.selectLocal(local, this.chosenCtx(local)); return; }
    const row = state.models.find((m) => m.ref === ref);
    if (!row) return;
    if (row.isProfile) this.selectProfile(row);
    else this.selectRemote(row);
  }

  selectedLocal() {
    return this._selectedLocal();
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
    pop.addEventListener('click', (e) => e.stopPropagation());
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
    const profile = this._selectedProfile();
    const ref = profile ? profile.baseRef : state.modelRef;
    return state.localModels.find((m) => m.ref === ref);
  }

  _selectedProfile() {
    const { state } = this._ctx;
    const row = state.models.find((m) => m.ref === state.modelRef);
    return row && row.isProfile ? row : null;
  }

  _profilesOf(baseRef) {
    return this._ctx.state.models.filter((m) => m.isProfile && m.baseRef === baseRef);
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
      this._addTuneButton(head, m.ref, m.displayName || m.name);
      pop.appendChild(head);
      const profiles = this._profilesOf(m.ref);
      const row = Dom.el('div', 'cm-ctx-row' + (profiles.length ? ' cm-ctx-row-more' : ''));
      for (const opt of (m.contextOptions || [])) row.appendChild(this._ctxChip(m, opt));
      pop.appendChild(row);
      if (profiles.length) pop.appendChild(this._profileList(profiles));
    }
  }

  _profileList(profiles) {
    const list = Dom.el('div', 'cm-profile-list');
    for (const p of profiles) list.appendChild(this._profileOption(p));
    return list;
  }

  _profileOption(p) {
    const o = Dom.el('div', 'cm-model-opt cm-profile-opt' + (p.ref === this._ctx.state.modelRef ? ' sel' : ''),
      '<span class="cm-profile-name">' + HtmlEscaper.escape(p.profileName) + '</span><span class="cm-profile-tag">profile</span>');
    o.title = p.label;
    o.addEventListener('click', () => this.selectProfile(p));
    this._addTuneButton(o, p.ref, p.label);
    return o;
  }

  _addTuneButton(row, ref, label) {
    if (!ModelTunePanel.available(this._ctx.api)) return;
    const btn = Dom.el('button', 'cm-tune-btn', ChatIcons.sliders);
    btn.type = 'button';
    btn.title = 'Tune settings for ' + label;
    btn.setAttribute('aria-label', btn.title);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._ctx.popovers.closeAll();
      new ModelTunePanel(this._ctx).open(ref, label);
    });
    row.appendChild(btn);
  }

  _appendGroups(pop) {
    const { state } = this._ctx;
    const groups = {};
    for (const m of state.models) {
      if (m.isLocal || m.isProfile) continue;
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
      for (const m of groups[g]) {
        pop.appendChild(this._remoteOption(m));
        const profiles = this._profilesOf(m.ref);
        if (profiles.length && !m.isLocal) pop.appendChild(this._profileList(profiles));
      }
    }
  }

  _remoteOption(m) {
    const o = Dom.el('div', 'cm-model-opt' + (m.ref === this._ctx.state.modelRef ? ' sel' : ''),
      '<span class="cm-dot' + (m.ready ? ' ready' : '') + '"></span><span class="cm-model-label">' + HtmlEscaper.escape(m.label) + '</span>');
    o.addEventListener('click', () => this.selectRemote(m));
    if (!m.isLocal) this._addTuneButton(o, m.ref, m.label);
    return o;
  }

  _pickContext(model, tokens) {
    const profile = this._selectedProfile();
    if (!(profile && profile.baseRef === model.ref)) { this.selectLocal(model, tokens); return; }
    this._ctx.state.ctxByRef[model.ref] = tokens;
    this.selectProfile(profile);
  }

  _ctxChip(model, opt) {
    const spec = ContextOptionText.chip(opt, this.chosenCtx(model) === opt.tokens);
    const chip = Dom.el('button', spec.cls.join(' '), HtmlEscaper.escape(spec.text));
    chip.title = spec.tip;
    chip.addEventListener('click', (e) => { e.stopPropagation(); this._pickContext(model, opt.tokens); });
    return chip;
  }
}
