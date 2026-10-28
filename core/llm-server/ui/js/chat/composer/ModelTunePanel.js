import DefaultsOptions from '../../setup-ui/defaults/DefaultsOptions.js';
import ChatModals from '../common/ChatModals.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ModelTunePanel {
  static REQUEST_FIELDS = [
    { id: 'reasoningEffort', label: 'Thinking', kind: 'select', options: DefaultsOptions.EFFORT },
    { id: 'temperature', label: 'Temperature', kind: 'number', min: 0, max: 2, step: 0.05 },
    { id: 'maxReplyTokens', label: 'Reply limit', kind: 'number', min: 1, step: 256, suffix: 'tokens' },
    { id: 'maxParallelToolCalls', label: 'Parallel tools', kind: 'number', min: 1, max: 8, step: 1, suffix: 'at once',
      hint: 'How many tool calls from one reply may run together (only reads overlap; writes still go one by one). '
        + 'One is the measured default: on a 27B model, more made runs slower and less accurate.' },
    { id: 'agentTimeoutMinutes', label: 'Run timeout', kind: 'number', min: 0, max: 240, step: 1, suffix: 'minutes',
      hint: 'How long one Tools-on turn may run before it stops and asks you to send "continue"; time spent inside '
        + 'tools does not count. 0 means no limit. A mode that needs longer (Code, say) keeps its own.' },
    { id: 'agentMaxIterations', label: 'Run steps', kind: 'number', min: 1, max: 400, step: 1, suffix: 'steps',
      hint: 'How many replies (each with its tool calls) one Tools-on turn may take before it stops. '
        + 'A mode that needs more keeps its own.' },
  ];

  static LAUNCH_FIELDS = [
    { id: 'kvCacheType', label: 'KV cache', kind: 'select', options: [
      { id: 'f16', label: 'Full (f16)' },
      { id: 'q8_0', label: 'Half (q8_0)' },
    ] },
  ];

  constructor(ctx) {
    this._ctx = ctx;
    this._busy = false;
  }

  static available(api) {
    return !!(api && api.modelSettings && api.modelSettings.get);
  }

  async open(ref, label, { highlight = null } = {}) {
    const { api } = this._ctx;
    const r = await api.modelSettings.get(ref);
    if (!(r && r.success && r.view)) return;
    this._view = r.view;
    this._label = label || ref;
    this._back = this._build();
    this._ctx.root.appendChild(this._back);
    this._arm();
    if (highlight) this._outline(highlight);
  }

  static OUTLINE_CLASS = 'cm-setting-hl';

  _outline(fieldId) {
    const el = this._back.querySelector('[data-field="' + fieldId + '"]');
    if (!el) return;
    const row = el.closest('.cm-tune-row');
    row.classList.add(ModelTunePanel.OUTLINE_CLASS);
    el.addEventListener('input', () => row.classList.remove(ModelTunePanel.OUTLINE_CLASS), { once: true });
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center' });
    el.focus();
    if (typeof el.select === 'function') el.select();
  }

  _build() {
    const v = this._view;
    const back = Dom.el('div', 'cm-modal-back');
    const card = Dom.el('div', 'cm-modal cm-tune');
    card.innerHTML = this._headHtml()
      + '<div class="cm-tune-rows">' + ModelTunePanel.REQUEST_FIELDS.map((f) => this._rowHtml(f, this._ownValue(f.id))).join('') + '</div>'
      + (this._showsLaunch() ? this._launchHtml() : '')
      + this._footHtml();
    back.appendChild(card);
    for (const el of card.querySelectorAll('[data-field]')) el.addEventListener('input', () => this._markRow(el));
    if (v.profile) card.querySelector('[data-tune-name]').value = v.profile.name;
    return back;
  }

  _headHtml() {
    const esc = HtmlEscaper.escape;
    const v = this._view;
    if (v.profile) {
      return '<div class="cm-modal-title">Profile</div>'
        + '<input class="cm-modal-input cm-tune-name" data-tune-name maxlength="60" aria-label="Profile name" />'
        + '<p class="cm-tune-intro">A named variant of <b>' + esc(this._baseLabel()) + '</b>. Pick it anywhere a model is picked, '
        + 'agents included. Fields left on Inherit use that model\'s settings.</p>';
    }
    return '<div class="cm-modal-title">Tune <span class="cm-tune-model">' + esc(this._label) + '</span></div>'
      + '<p class="cm-tune-intro">Applies wherever this model is used. Fields left on Inherit follow your defaults.</p>';
  }

  _launchHtml() {
    const launch = ModelTunePanel.LAUNCH_FIELDS.map((f) => this._rowHtml(f, this._ownValue(f.id))).join('');
    const flags = '<div class="cm-tune-row' + (this._view.model.launchFlags ? ' set' : '') + '">'
      + '<label class="cm-tune-label" for="cm-tune-flags">Extra flags</label>'
      + '<input id="cm-tune-flags" class="cm-modal-input" data-field="launchFlags" spellcheck="false" placeholder="none, e.g. --mlock" />'
      + '</div>';
    return '<div class="cm-tune-section">When this model loads <span>applies on its next load</span></div>'
      + '<div class="cm-tune-rows">' + launch + flags + '</div>';
  }

  _footHtml() {
    const left = this._view.profile
      ? '<button class="cm-modal-btn cm-tune-left" data-act="delete">Delete profile</button>'
      : '<button class="cm-modal-btn cm-tune-left" data-act="profile" title="Save these values as a separate named profile; this model stays as it is">Save as profile…</button>';
    return '<div class="cm-modal-actions">' + left
      + '<button class="cm-modal-btn" data-act="cancel">Cancel</button>'
      + '<button class="cm-modal-btn primary" data-act="save">Save</button></div>';
  }

  _rowHtml(field, value) {
    const esc = HtmlEscaper.escape;
    const id = 'cm-tune-' + field.id;
    const set = value !== undefined && value !== null;
    const control = field.kind === 'select'
      ? '<select id="' + id + '" class="cm-modal-input" data-field="' + field.id + '">'
        + '<option value="">' + esc(this._inheritText(field)) + '</option>'
        + field.options.map((o) => '<option value="' + esc(o.id) + '"' + (o.id === value ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('')
        + '</select>'
      : '<input id="' + id + '" class="cm-modal-input" type="number" data-field="' + field.id + '"'
        + ' min="' + field.min + '"' + (field.max != null ? ' max="' + field.max + '"' : '') + ' step="' + field.step + '"'
        + ' placeholder="' + esc(this._inheritText(field)) + '" value="' + (set ? esc(String(value)) : '') + '" />';
    const hint = field.hint ? ' title="' + esc(field.hint) + '"' : '';
    return '<div class="cm-tune-row' + (set ? ' set' : '') + '"' + hint + '>'
      + '<label class="cm-tune-label" for="' + id + '">' + esc(field.label) + '</label>'
      + control + (field.suffix ? '<span class="cm-tune-suffix">' + esc(field.suffix) + '</span>' : '')
      + '</div>';
  }

  _inheritText(field) {
    const v = this._view;
    const fromModel = v.profile ? v.model.overrides[field.id] : undefined;
    const value = fromModel !== undefined ? fromModel : v.defaults[field.id];
    const shown = ModelTunePanel._valueText(field, value);
    return 'Inherit (' + (fromModel !== undefined ? 'model: ' : '') + shown + ')';
  }

  static _valueText(field, value) {
    if (field.id === 'temperature' && value == null) return 'chat mode decides';
    if (field.id === 'maxReplyTokens' && value == null) return 'no limit';
    if (field.id === 'maxParallelToolCalls' && value == null) return 'one at a time';
    if (field.id === 'agentTimeoutMinutes' && value === 0) return 'no limit';
    if (field.id === 'kvCacheType' && value == null) return 'Full (f16)';
    if (field.kind === 'select') {
      const hit = field.options.find((o) => o.id === value);
      return hit ? hit.label : String(value);
    }
    return String(value);
  }

  _ownValue(fieldId) {
    const v = this._view;
    const layer = v.profile ? v.profile.overrides : v.model.overrides;
    return layer[fieldId];
  }

  _showsLaunch() {
    return this._view.isLocal && !this._view.profile;
  }

  _baseLabel() {
    const { state } = this._ctx;
    const base = (state.models || []).find((m) => m.ref === this._view.baseRef);
    return base ? base.label : this._view.baseRef;
  }

  _markRow(el) {
    el.closest('.cm-tune-row').classList.toggle('set', String(el.value).trim() !== '');
  }

  _arm() {
    const back = this._back;
    const flags = back.querySelector('[data-field="launchFlags"]');
    if (flags) flags.value = this._view.model.launchFlags || '';
    this._onKey = (ev) => {
      if (this._busy) return;
      if (ev.key === 'Escape') { ev.preventDefault(); this._close(); }
      else if (ev.key === 'Enter' && ev.target.tagName !== 'SELECT') { ev.preventDefault(); this._save(); }
    };
    document.addEventListener('keydown', this._onKey, true);
    back.addEventListener('click', (ev) => this._onClick(ev));
  }

  _onClick(ev) {
    if (ev.target === this._back) { this._close(); return; }
    const act = ev.target.closest('[data-act]');
    if (!act) return;
    const action = act.dataset.act;
    if (action === 'cancel') this._close();
    else if (action === 'save') this._save();
    else if (action === 'profile') this._saveAsProfile();
    else if (action === 'delete') this._deleteProfile();
  }

  _formOverrides(fields) {
    const out = {};
    for (const f of fields) {
      const el = this._back.querySelector('[data-field="' + f.id + '"]');
      const raw = el ? String(el.value).trim() : '';
      if (raw === '') continue;
      out[f.id] = f.kind === 'number' ? Number(raw) : raw;
    }
    return out;
  }

  async _save() {
    const { api } = this._ctx;
    const v = this._view;
    const overrides = this._formOverrides(ModelTunePanel.REQUEST_FIELDS);
    let r;
    if (v.profile) {
      const name = this._back.querySelector('[data-tune-name]').value.trim();
      r = await api.modelSettings.saveProfile({ id: v.profile.id, name, baseRef: v.baseRef, overrides });
    } else {
      const launch = this._showsLaunch() ? this._formOverrides(ModelTunePanel.LAUNCH_FIELDS) : {};
      const flags = this._back.querySelector('[data-field="launchFlags"]');
      r = await api.modelSettings.setModel(v.baseRef, {
        overrides: { ...overrides, ...launch },
        ...(flags ? { launchFlags: flags.value } : {}),
      });
    }
    if (!(r && r.success)) { this._showError(r && r.error); return; }
    this._close();
    await this._refresh();
  }

  async _saveAsProfile() {
    const { api } = this._ctx;
    const name = await this._nested(() => ChatModals.prompt(this._ctx.root, 'Name this profile (for example "Precise" or "Creative")', ''));
    if (!name) return;
    const r = await api.modelSettings.saveProfile({ name, baseRef: this._view.baseRef, overrides: this._formOverrides(ModelTunePanel.REQUEST_FIELDS) });
    if (!(r && r.success && r.profile)) { this._showError(r && r.error); return; }
    this._close();
    await this._refresh();
    this._ctx.models.selectRef(r.profile.ref);
  }

  async _deleteProfile() {
    const { api, state } = this._ctx;
    const v = this._view;
    const ok = await this._nested(() => ChatModals.confirm(this._ctx.root,
      'Delete the profile "' + v.profile.name + '"? Chats and agents using it fall back to another model.',
      { danger: true, confirmLabel: 'Delete' }));
    if (!ok) return;
    const r = await api.modelSettings.deleteProfile(v.profile.id);
    if (!(r && r.success)) { this._showError(r && r.error); return; }
    const wasSelected = state.modelRef === v.selectedRef;
    this._close();
    await this._refresh();
    if (wasSelected) this._ctx.models.selectRef(v.baseRef);
  }

  async _nested(open) {
    this._busy = true;
    try { return await open(); } finally { this._busy = false; }
  }

  async _refresh() {
    await this._ctx.models.refresh();
    if (this._ctx.thinkPill && this._ctx.thinkPill.load) this._ctx.thinkPill.load();
  }

  _showError(message) {
    let el = this._back && this._back.querySelector('.cm-tune-error');
    if (!el) {
      el = Dom.el('div', 'cm-tune-error');
      this._back.querySelector('.cm-modal-actions').before(el);
    }
    el.textContent = message || 'Could not save.';
  }

  _close() {
    if (this._onKey) document.removeEventListener('keydown', this._onKey, true);
    this._onKey = null;
    if (this._back) this._back.remove();
    this._back = null;
  }
}
