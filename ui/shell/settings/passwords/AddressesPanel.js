import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class AddressesPanel {
  static CONFIRM_MS = 3000;

  constructor({ security = null } = {}) {
    this._security = security;
    this._profiles = [];
    this._fields = [];
    this._editingId = null;
    this._confirmDelete = null;
  }

  install() {
    this._api = window.vaultAPI;
    const $ = (id) => document.getElementById(id);
    this._el = {
      offer: $('gsAddrOffer'), add: $('gsAddrAdd'), editor: $('gsAddrEditor'), title: $('gsAddrTitle'), fields: $('gsAddrFields'),
      cancel: $('gsAddrCancel'), error: $('gsAddrError'), list: $('gsAddrList'), empty: $('gsAddrEmpty'), ai: $('gsAddrAi'),
    };
    if (!this._api || !this._el.list) return false;
    this._el.offer.addEventListener('change', () => this._api.setOfferAddresses(this._el.offer.checked));
    this._el.add.addEventListener('click', () => this.openEditor(null));
    this._el.cancel.addEventListener('click', () => this.closeEditor());
    this._el.editor.addEventListener('submit', (ev) => { ev.preventDefault(); this._save(); });
    this._el.list.addEventListener('click', (ev) => this._onRowClick(ev));
    document.addEventListener('settings:open', () => this.refresh());
    const tab = document.querySelector('.settings-tab[data-tab="passwords"]');
    if (tab) tab.addEventListener('click', () => this.refresh());
    return true;
  }

  async refresh() {
    try {
      const [status, items] = await Promise.all([this._api.status(), this._api.list()]);
      this._fields = (status && status.profileFields) || [];
      this._el.offer.checked = !status || status.offerAddresses !== false;
      this._profiles = (Array.isArray(items) ? items : []).filter((i) => i.type === 'profile');
    } catch (_) {
      this._profiles = [];
    }
    this.render();
  }

  render() {
    this._el.list.innerHTML = this._profiles.map((p) => AddressesPanel.rowHtml(p)).join('');
    this._el.empty.style.display = this._profiles.length ? 'none' : '';
  }

  static summary(p) {
    const name = p.fullName || [p.givenName, p.familyName].filter(Boolean).join(' ');
    return [name, p.street, p.city, p.postalCode, p.email, p.phone].filter(Boolean).join(', ');
  }

  static rowHtml(p) {
    const esc = HtmlEscaper.escape;
    return `<div class="gs-ide-row gs-vault-row" data-id="${esc(p.id)}">`
      + `<span class="gs-ide-cell gs-ide-name gs-vault-site">${esc(p.title || 'Address')}${p.aiAccess ? '<span class="gs-vault-ai">Assistant</span>' : ''}</span>`
      + `<span class="gs-ide-cell gs-vault-user">${esc(AddressesPanel.summary(p))}</span>`
      + '<span class="gs-vault-acts"><button class="gs-action-btn" data-act="edit">Edit</button>'
      + '<button class="gs-action-btn" data-act="delete">Delete</button></span></div>';
  }

  static fieldsHtml(fields, profile) {
    const esc = HtmlEscaper.escape;
    return fields.map((f) => `<label class="gs-vault-field"><span>${esc(f.label)}</span>`
      + `<input type="text" class="form-input" data-key="${esc(f.key)}" value="${esc((profile && profile[f.key]) || '')}" spellcheck="false"></label>`).join('');
  }

  openEditor(id) {
    const profile = id ? this._profiles.find((p) => p.id === id) : null;
    this._editingId = profile ? profile.id : null;
    this._el.title.value = profile ? profile.title || '' : '';
    if (this._el.ai) this._el.ai.checked = !!(profile && profile.aiAccess);
    this._el.fields.innerHTML = AddressesPanel.fieldsHtml(this._fields, profile);
    this._el.error.textContent = '';
    this._el.editor.hidden = false;
    this._el.title.focus();
  }

  closeEditor() {
    this._el.editor.hidden = true;
    this._editingId = null;
  }

  async _save() {
    const aiAccess = !!(this._el.ai && this._el.ai.checked);
    if (aiAccess && this._security && !(await this._security.request())) return;
    const data = { type: 'profile', id: this._editingId || undefined, title: this._el.title.value, aiAccess };
    for (const input of this._el.fields.querySelectorAll('input[data-key]')) data[input.dataset.key] = input.value;
    const res = await this._api.save(data);
    if (!res || !res.success) { this._el.error.textContent = (res && res.error) || 'Could not save'; return; }
    this.closeEditor();
    await this.refresh();
  }

  async _onRowClick(ev) {
    const btn = ev.target.closest('button[data-act]');
    const row = btn && btn.closest('[data-id]');
    if (!row) return;
    if (btn.dataset.act === 'edit') { this.openEditor(row.dataset.id); return; }
    if (this._confirmDelete !== row.dataset.id) {
      this._confirmDelete = row.dataset.id;
      btn.textContent = 'Confirm';
      setTimeout(() => { if (this._confirmDelete === row.dataset.id) { this._confirmDelete = null; this.render(); } }, AddressesPanel.CONFIRM_MS);
      return;
    }
    this._confirmDelete = null;
    await this._api.remove(row.dataset.id);
    await this.refresh();
  }
}
