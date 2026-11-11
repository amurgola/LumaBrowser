import ComposerView from './ComposerView.js';
import ContextOptionText from './ContextOptionText.js';
import LocalModelRows from './LocalModelRows.js';
import ModelTunePanel from './ModelTunePanel.js';
import ChatIcons from '../ChatIcons.js';
import PopoverFit from '../common/PopoverFit.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import ModelTree from '../../models/ModelTree.js';

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
    const name = lm ? ModelTree.label(lm) : label;
    const kind = lm ? 'local' : 'remote';
    root.querySelectorAll('[data-cm-landing-context]').forEach((el) => {
      const existing = el.querySelector('.cm-landing-model');
      if (known && existing && existing.dataset.kind === kind) {
        existing.querySelector('b').textContent = name;
        return;
      }
      el.textContent = '';
      if (!known) return;
      const btn = this._landingButton(name, kind);
      if (lm) el.append(btn, ' runs on this machine. Nothing you type leaves it.');
      else el.append('Chatting with ', btn, '.');
    });
  }

  _landingButton(name, kind) {
    const btn = Dom.el('button', 'cm-landing-model', '<b></b><span class="cm-caret">' + ChatIcons.chevron + '</span>');
    btn.type = 'button';
    btn.dataset.kind = kind;
    btn.title = 'Change the model or its context length';
    btn.querySelector('b').textContent = name;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.querySelector('.cm-model-pop')) { this._ctx.popovers.closeAll(); return; }
      this.openPicker(btn, true, { down: true });
    });
    return btn;
  }

  currentLabel() {
    const { state } = this._ctx;
    const lm = this._selectedLocal();
    if (lm) {
      const t = this.chosenCtx(lm);
      const profile = this._selectedProfile();
      return 'Local · ' + ModelTree.label(lm) + (profile ? ' · ' + profile.profileName : '')
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

  openPicker(anchor, refresh, opts = {}) {
    this._ctx.popovers.closeAll();
    const pop = Dom.el('div', 'cm-model-pop' + (opts.down ? ' cm-model-pop--down' : ''));
    pop.addEventListener('click', (e) => e.stopPropagation());
    new LocalModelRows(this, this._ctx).render(pop);
    this._appendGroups(pop);
    if (!pop.querySelector('.cm-model-opt')) return;
    anchor.appendChild(pop);
    if (!opts.down) PopoverFit.fitScrolling(pop, this._ctx.root, ModelPicker.MIN_POP);
    const sel = LocalModelRows.selectedRow(pop);
    if (sel && pop.scrollHeight > pop.clientHeight) pop.scrollTop = Math.max(0, sel.offsetTop - pop.clientHeight / 3);
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

  profilesOf(baseRef) {
    return this._ctx.state.models.filter((m) => m.isProfile && m.baseRef === baseRef);
  }

  profileList(profiles) {
    const list = Dom.el('div', 'cm-profile-list');
    for (const p of profiles) list.appendChild(this._profileOption(p));
    return list;
  }

  _profileOption(p) {
    const o = Dom.el('div', 'cm-model-opt cm-profile-opt' + (p.ref === this._ctx.state.modelRef ? ' sel' : ''),
      '<span class="cm-profile-name">' + HtmlEscaper.escape(p.profileName) + '</span><span class="cm-profile-tag">profile</span>');
    o.title = p.label;
    o.addEventListener('click', () => this.selectProfile(p));
    this.addTuneButton(o, p.ref, p.label);
    return o;
  }

  addTuneButton(row, ref, label) {
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
      if (m.isLocal || m.isProfile || m.role === 'helper') continue;
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
        const profiles = this.profilesOf(m.ref);
        if (profiles.length && !m.isLocal) pop.appendChild(this.profileList(profiles));
      }
    }
  }

  _remoteOption(m) {
    const o = Dom.el('div', 'cm-model-opt' + (m.ref === this._ctx.state.modelRef ? ' sel' : ''),
      '<span class="cm-dot' + (m.ready ? ' ready' : '') + '"></span><span class="cm-model-label">' + HtmlEscaper.escape(m.label) + '</span>');
    o.addEventListener('click', () => this.selectRemote(m));
    if (!m.isLocal) this.addTuneButton(o, m.ref, m.label);
    return o;
  }

  pickContext(model, tokens) {
    const profile = this._selectedProfile();
    if (!(profile && profile.baseRef === model.ref)) { this.selectLocal(model, tokens); return; }
    this._ctx.state.ctxByRef[model.ref] = tokens;
    this.selectProfile(profile);
  }
}
