import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ThinkPill {
  constructor(ctx) {
    this._ctx = ctx;
    this._seq = 0;
    this._capsFor = null;
    this._capsKnown = false;
  }

  syncToModel() {
    if (this._key() !== this._capsFor) this.load();
  }

  async load(opts) {
    const key = this._key();
    const skipCaps = !!(opts && opts.onlyIfUnknown) && this._capsKnown && this._capsFor === key;
    const seq = ++this._seq;
    if (!skipCaps) {
      const { caps, remembered } = await this._fetchCaps();
      if (seq !== this._seq) return;
      this._applyCaps(key, caps, remembered);
    }
    await this._loadDefault();
    this.render();
  }

  render() {
    const { root, state } = this._ctx;
    if (!root) return;
    root.querySelectorAll('[data-cm-effort]').forEach((host) => {
      const dial = state.thinkDial;
      if (!state.thinkSupported || !dial || !dial.length) { host.hidden = true; host.innerHTML = ''; return; }
      this._paint(host, dial);
    });
  }

  static labelFor(dial, id) {
    const hit = (dial || []).find((d) => d.id === id);
    return hit ? hit.short : id;
  }

  _key() {
    const { state } = this._ctx;
    const lm = state.localModels.find((m) => m.ref === state.modelRef);
    return String(state.modelRef || '') + '|' + (lm ? lm.path : '');
  }

  async _fetchCaps() {
    const { api, state } = this._ctx;
    try {
      const lm = state.localModels.find((m) => m.ref === state.modelRef);
      const sel = state.models.find((m) => m.ref === state.modelRef);
      if (api.getModelCaps && (lm || (sel && sel.isLocal))) {
        try {
          const r = await api.getModelCaps(lm ? lm.path : undefined);
          if (r && r.success) return { caps: r.caps || null, remembered: true };
        } catch (_) {}
      }
      const st = api.getServerStatus ? await api.getServerStatus() : null;
      return { caps: (st && st.caps) || null, remembered: false };
    } catch (_) {
      return { caps: null, remembered: false };
    }
  }

  _applyCaps(key, caps, remembered) {
    const { state } = this._ctx;
    this._capsFor = key;
    this._capsKnown = remembered && !!(caps && typeof caps.reasoningEffort === 'boolean');
    state.thinkSupported = !!(caps && caps.reasoningEffort);
    state.thinkDial = (caps && Array.isArray(caps.reasoningDial)) ? caps.reasoningDial : null;
  }

  async _loadDefault() {
    const { api, state } = this._ctx;
    try {
      const d = api.getDefaults ? await api.getDefaults() : null;
      state.thinkDefault = (d && d.noThink) ? 'off' : ((d && d.reasoningEffort) || 'default');
    } catch (_) {
      state.thinkDefault = 'default';
    }
  }

  _paint(host, dial) {
    const { state } = this._ctx;
    const esc = HtmlEscaper.escape;
    const active = state.reasoningEffort || state.thinkDefault || 'default';
    const inherited = !state.reasoningEffort;
    host.hidden = false;
    host.className = 'cm-effort' + (inherited ? ' cm-effort-inherited' : '');
    host.title = inherited
      ? 'Thinking budget for this chat. Following your default (' + ThinkPill.labelFor(dial, active) + ') from Setup.'
      : 'Thinking budget for this chat only. Your default is ' + ThinkPill.labelFor(dial, state.thinkDefault) + '.';
    host.innerHTML = dial.map((d) => {
      const off = d.enabled === false;
      return '<button type="button" class="cm-effort-seg' + (d.id === active ? ' on' : '') + (off ? ' unavailable' : '') + '"'
        + ' data-effort="' + esc(d.id) + '"' + (off ? ' aria-disabled="true"' : '')
        + ' title="' + esc(off && d.reason ? d.reason : d.label) + '">'
        + esc(d.short) + '</button>';
    }).join('');
    host.querySelectorAll('.cm-effort-seg').forEach((btn) => btn.addEventListener('click', (e) => this._onSegment(e, btn)));
  }

  _onSegment(e, btn) {
    e.stopPropagation();
    if (btn.classList.contains('unavailable')) return;
    const { state } = this._ctx;
    const pos = btn.getAttribute('data-effort');
    state.reasoningEffort = (state.reasoningEffort === pos) ? null : pos;
    this._persist();
    this.render();
  }

  _persist() {
    const { api, state } = this._ctx;
    if (!state.activeId || !api.conv || !api.conv.setReasoningEffort) return;
    try { api.conv.setReasoningEffort(state.activeId, state.reasoningEffort); } catch (_) {}
  }
}
