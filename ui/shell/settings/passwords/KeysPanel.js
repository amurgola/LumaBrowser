import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Clipboard from '../../../../core/llm-server/ui/js/dom/Clipboard.js';

export default class KeysPanel {
  static MASK = '••••••••';

  static CONFIRM_MS = 3000;

  constructor({ feedback, security = null }) {
    this._feedback = feedback;
    this._security = security;
    this._keys = [];
    this._revealed = new Map();
    this._editingId = null;
    this._confirmDelete = null;
  }

  install() {
    this._api = window.vaultAPI;
    const $ = (id) => document.getElementById(id);
    this._el = {
      add: $('gsKeyAdd'), editor: $('gsKeyEditor'), name: $('gsKeyName'), value: $('gsKeyValue'), notes: $('gsKeyNotes'),
      ai: $('gsKeyAi'), cancel: $('gsKeyCancel'), error: $('gsKeyError'), list: $('gsKeyList'), empty: $('gsKeyEmpty'),
    };
    if (!this._api || !this._el.list) return false;
    this._el.add.addEventListener('click', () => this.openEditor(null));
    this._el.cancel.addEventListener('click', () => this.closeEditor());
    this._el.editor.addEventListener('submit', (ev) => { ev.preventDefault(); this._save(); });
    this._el.list.addEventListener('click', (ev) => this._onRowClick(ev));
    document.addEventListener('settings:open', () => this.refresh());
    document.addEventListener('settings:close', () => { this._revealed.clear(); this.closeEditor(); });
    const tab = document.querySelector('.settings-tab[data-tab="passwords"]');
    if (tab) tab.addEventListener('click', () => this.refresh());
    return true;
  }

  async refresh() {
    let items = [];
    try { items = await this._api.list(); } catch (_) { items = []; }
    this._keys = (Array.isArray(items) ? items : []).filter((i) => i.type === 'key');
    this._revealed.clear();
    this.render();
  }

  render() {
    this._el.list.innerHTML = this._keys.map((k) => KeysPanel.rowHtml(k, this._revealed.get(k.id))).join('');
    this._el.empty.style.display = this._keys.length ? 'none' : '';
  }

  static rowHtml(k, revealed) {
    const esc = HtmlEscaper.escape;
    const ai = k.aiAccess ? '<span class="gs-vault-ai" title="The assistant may use this key by its placeholder">Assistant</span>' : '';
    return `<div class="gs-ide-row gs-vault-row" data-id="${esc(k.id)}">`
      + `<span class="gs-ide-cell gs-ide-name gs-vault-site">${esc(k.title)}${ai}</span>`
      + `<span class="gs-ide-cell gs-vault-user"><code>${esc(k.placeholder || '')}</code></span>`
      + `<span class="gs-ide-cell gs-vault-secret">${revealed == null ? KeysPanel.MASK : esc(revealed)}</span>`
      + '<span class="gs-vault-acts">'
      + `<button class="gs-action-btn" data-act="reveal">${revealed == null ? 'Show' : 'Hide'}</button>`
      + '<button class="gs-action-btn" data-act="copy">Copy</button>'
      + '<button class="gs-action-btn" data-act="edit">Edit</button>'
      + '<button class="gs-action-btn" data-act="delete">Delete</button></span></div>';
  }

  async _unlocked() {
    return this._security ? this._security.request() : true;
  }

  async _onRowClick(ev) {
    const btn = ev.target.closest('button[data-act]');
    const row = btn && btn.closest('[data-id]');
    if (!row) return;
    const id = row.dataset.id;
    const act = btn.dataset.act;
    if (act === 'edit') { this.openEditor(id); return; }
    if (act === 'delete') { await this._delete(id, btn); return; }
    if (act === 'reveal' && this._revealed.has(id)) { this._revealed.delete(id); this.render(); return; }
    if (!(await this._unlocked())) return;
    const res = await this._api.reveal(id);
    if (!res || !res.success) return;
    if (act === 'copy') { await Clipboard.copyText(res.password); this._feedback.toast('Key copied', 'ok'); return; }
    this._revealed.set(id, res.password);
    this.render();
  }

  async _delete(id, btn) {
    if (this._confirmDelete !== id) {
      this._confirmDelete = id;
      btn.textContent = 'Confirm';
      setTimeout(() => { if (this._confirmDelete === id) { this._confirmDelete = null; this.render(); } }, KeysPanel.CONFIRM_MS);
      return;
    }
    this._confirmDelete = null;
    await this._api.remove(id);
    await this.refresh();
  }

  openEditor(id) {
    const k = id ? this._keys.find((x) => x.id === id) : null;
    this._editingId = k ? k.id : null;
    this._el.name.value = k ? k.title : '';
    this._el.value.value = '';
    this._el.value.placeholder = k ? 'Leave empty to keep the saved key' : 'Paste the key or token';
    this._el.notes.value = k ? k.notes || '' : '';
    this._el.ai.checked = !!(k && k.aiAccess);
    this._el.error.textContent = '';
    this._el.editor.hidden = false;
    this._el.name.focus();
  }

  closeEditor() {
    if (!this._el || !this._el.editor) return;
    this._el.editor.hidden = true;
    this._el.value.value = '';
    this._editingId = null;
  }

  async _save() {
    if (!(await this._unlocked())) return;
    const res = await this._api.save({
      type: 'key', id: this._editingId || undefined, title: this._el.name.value, value: this._el.value.value,
      notes: this._el.notes.value, aiAccess: this._el.ai.checked,
    });
    if (!res || !res.success) { this._el.error.textContent = (res && res.error) || 'Could not save'; return; }
    this.closeEditor();
    await this.refresh();
  }
}
