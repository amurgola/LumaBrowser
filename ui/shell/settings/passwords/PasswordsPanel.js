import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Clipboard from '../../../../core/llm-server/ui/js/dom/Clipboard.js';

export default class PasswordsPanel {
  static MASK = '••••••••';

  static CONFIRM_MS = 3000;

  constructor({ feedback, security = null }) {
    this._feedback = feedback;
    this._security = security;
    this._items = [];
    this._revealed = new Map();
    this._editingId = null;
    this._confirmDelete = null;
  }

  install() {
    this._api = window.vaultAPI;
    const $ = (id) => document.getElementById(id);
    this._el = {
      status: $('gsVaultStatus'), warning: $('gsVaultWarning'), offer: $('gsVaultOffer'), search: $('gsVaultSearch'),
      add: $('gsVaultAdd'), importBtn: $('gsVaultImport'), exportBtn: $('gsVaultExport'), editor: $('gsVaultEditor'),
      origin: $('gsVaultOrigin'), user: $('gsVaultUser'), pass: $('gsVaultPass'), notes: $('gsVaultNotes'), ai: $('gsVaultAi'), totp: $('gsVaultTotp'), show: $('gsVaultShow'),
      generate: $('gsVaultGenerate'), cancel: $('gsVaultCancel'), error: $('gsVaultError'), list: $('gsVaultList'),
      empty: $('gsVaultEmpty'), never: $('gsVaultNeverList'), neverEmpty: $('gsVaultNeverEmpty'),
    };
    if (!this._api || !this._el.list) return false;
    this._wire();
    document.addEventListener('settings:open', () => this.refresh());
    const tab = document.querySelector('.settings-tab[data-tab="passwords"]');
    if (tab) tab.addEventListener('click', () => this.refresh());
    document.addEventListener('settings:close', () => this._forgetSecrets());
    return true;
  }

  _wire() {
    const e = this._el;
    e.offer.addEventListener('change', () => this._api.setOfferToSave(e.offer.checked));
    e.search.addEventListener('input', () => this.render());
    e.add.addEventListener('click', () => this.openEditor(null));
    e.importBtn.addEventListener('click', () => this._import());
    e.exportBtn.addEventListener('click', () => this._export());
    e.cancel.addEventListener('click', () => this.closeEditor());
    e.show.addEventListener('click', () => this._toggleEditorPassword());
    e.generate.addEventListener('click', () => this._generate());
    e.editor.addEventListener('submit', (ev) => { ev.preventDefault(); this._saveEditor(); });
    e.list.addEventListener('click', (ev) => this._onRowClick(ev));
    e.never.addEventListener('click', (ev) => this._onNeverClick(ev));
  }

  async refresh() {
    try {
      const [status, items, never] = await Promise.all([this._api.status(), this._api.list(), this._api.neverList()]);
      this._status = status || {};
      this._items = (Array.isArray(items) ? items : []).filter((i) => (i.type || 'login') === 'login');
      this._never = Array.isArray(never) ? never : [];
    } catch (_) {
      this._status = {};
      this._items = [];
      this._never = [];
    }
    this._forgetSecrets();
    this.render();
  }

  render() {
    this._renderStatus();
    const shown = PasswordsPanel.filter(this._items, this._el.search.value);
    this._el.list.innerHTML = shown.map((item) => PasswordsPanel.rowHtml(item, this._revealed.get(item.id))).join('');
    this._el.empty.style.display = this._items.length ? 'none' : '';
    this._el.exportBtn.disabled = !this._items.length;
    this._el.never.innerHTML = this._never.map((origin) => PasswordsPanel.neverRowHtml(origin)).join('');
    this._el.neverEmpty.style.display = this._never.length ? 'none' : '';
  }

  _renderStatus() {
    const s = this._status || {};
    this._el.offer.checked = s.offerToSave !== false;
    const count = this._items.length;
    const where = s.encrypted ? 'encrypted with your Windows account' : 'stored on this computer';
    this._el.status.textContent = count
      ? `${count} saved password${count === 1 ? '' : 's'}, ${where}. LumaBrowser fills them only on the site they belong to.`
      : 'Saved sign-ins for the sites you use. LumaBrowser fills them for you and only on the site they belong to.';
    const warning = PasswordsPanel.warningFor(s);
    this._el.warning.hidden = !warning;
    this._el.warning.textContent = warning;
  }

  static warningFor(status) {
    if (status.unreadable) return 'The saved passwords were encrypted by another Windows account or computer and cannot be opened here. Nothing will be changed or overwritten.';
    if (status.encrypted === false) return 'This system offers no keychain, so saved passwords are kept unencrypted on this computer.';
    return '';
  }

  static filter(items, query) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return items;
    return items.filter((i) => {
      const hay = `${i.host} ${i.origin} ${i.username} ${i.title}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }

  static rowHtml(item, revealed) {
    const esc = HtmlEscaper.escape;
    const id = esc(item.id);
    const secret = revealed == null ? PasswordsPanel.MASK : esc(revealed);
    const ai = (item.aiAccess ? '<span class="gs-vault-ai" title="The assistant may sign in with this login">Assistant</span>' : '')
      + (item.hasTotp ? '<span class="gs-vault-ai" title="Holds a two-factor secret">2FA</span>' : '');
    return `<div class="gs-ide-row gs-vault-row" data-id="${id}">`
      + `<span class="gs-ide-cell gs-ide-name gs-vault-site" title="${esc(item.origin)}">${esc(item.host || item.origin)}${ai}</span>`
      + `<span class="gs-ide-cell gs-vault-user">${esc(item.username || '(no username)')}</span>`
      + `<span class="gs-ide-cell gs-vault-secret">${secret}</span>`
      + '<span class="gs-vault-acts">'
      + `<button class="gs-action-btn" data-act="reveal">${revealed == null ? 'Show' : 'Hide'}</button>`
      + '<button class="gs-action-btn" data-act="copy">Copy</button>'
      + (item.hasTotp ? '<button class="gs-action-btn" data-act="code" title="Copy the current two-factor code">Code</button>' : '')
      + '<button class="gs-action-btn" data-act="edit">Edit</button>'
      + '<button class="gs-action-btn" data-act="delete">Delete</button>'
      + '</span></div>';
  }

  static neverRowHtml(origin) {
    const esc = HtmlEscaper.escape;
    return `<div class="gs-ide-row" data-origin="${esc(origin)}">`
      + `<span class="gs-ide-cell gs-ide-cell--grow gs-ide-name">${esc(origin)}</span>`
      + '<button class="gs-action-btn" data-act="never-remove">Remove</button></div>';
  }

  async _onRowClick(ev) {
    const btn = ev.target.closest('button[data-act]');
    const row = btn && btn.closest('[data-id]');
    if (!row) return;
    const id = row.dataset.id;
    const act = btn.dataset.act;
    if (act === 'reveal') await this._toggleReveal(id);
    else if (act === 'copy') await this._copy(id);
    else if (act === 'code') await this._copyCode(id);
    else if (act === 'edit') await this.openEditor(id);
    else if (act === 'delete') await this._delete(id, btn);
  }

  async _unlocked() {
    return this._security ? this._security.request() : true;
  }

  async _toggleReveal(id) {
    if (this._revealed.has(id)) this._revealed.delete(id);
    else {
      if (!(await this._unlocked())) return;
      const res = await this._api.reveal(id);
      if (res && res.success) this._revealed.set(id, res.password);
    }
    this.render();
  }

  async _copy(id) {
    if (!(await this._unlocked())) return;
    const res = await this._api.reveal(id);
    if (!res || !res.success) return;
    await Clipboard.copyText(res.password);
    this._feedback.toast('Password copied', 'ok');
  }

  async _copyCode(id) {
    if (!(await this._unlocked())) return;
    const res = await this._api.totpCode(id);
    if (!res || !res.success) { this._feedback.toast((res && res.error) || 'No code', 'bad'); return; }
    await Clipboard.copyText(res.code);
    this._feedback.toast(`Code ${res.code} copied (${res.secondsLeft} s left)`, 'ok');
  }

  async _delete(id, btn) {
    if (this._confirmDelete !== id) {
      this._confirmDelete = id;
      btn.textContent = 'Confirm';
      setTimeout(() => { if (this._confirmDelete === id) { this._confirmDelete = null; this.render(); } }, PasswordsPanel.CONFIRM_MS);
      return;
    }
    this._confirmDelete = null;
    await this._api.remove(id);
    await this.refresh();
  }

  async _onNeverClick(ev) {
    const btn = ev.target.closest('button[data-act="never-remove"]');
    const row = btn && btn.closest('[data-origin]');
    if (!row) return;
    await this._api.neverRemove(row.dataset.origin);
    await this.refresh();
  }

  async openEditor(id) {
    const e = this._el;
    const item = id ? this._items.find((i) => i.id === id) : null;
    if (item && !(await this._unlocked())) return;
    this._editingId = item ? item.id : null;
    if (e.ai) e.ai.checked = !!(item && item.aiAccess);
    e.origin.value = item ? item.origin : '';
    e.user.value = item ? item.username : '';
    e.notes.value = item ? item.notes || '' : '';
    e.pass.value = '';
    if (e.totp) e.totp.value = '';
    e.pass.type = 'password';
    e.show.textContent = 'Show';
    e.error.textContent = '';
    if (item) {
      const res = await this._api.reveal(item.id);
      e.pass.value = res && res.success ? res.password : '';
      if (e.totp) e.totp.value = res && res.success ? res.totp || '' : '';
    }
    e.editor.hidden = false;
    (item ? e.user : e.origin).focus();
  }

  closeEditor() {
    const e = this._el;
    e.editor.hidden = true;
    e.pass.value = '';
    this._editingId = null;
  }

  _toggleEditorPassword() {
    const e = this._el;
    const show = e.pass.type === 'password';
    e.pass.type = show ? 'text' : 'password';
    e.show.textContent = show ? 'Hide' : 'Show';
  }

  async _generate() {
    const e = this._el;
    e.pass.value = await this._api.generate();
    e.pass.type = 'text';
    e.show.textContent = 'Hide';
  }

  async _saveEditor() {
    const e = this._el;
    const aiAccess = !!(e.ai && e.ai.checked);
    if (aiAccess && !(await this._unlocked())) return;
    const res = await this._api.save({
      id: this._editingId || undefined, origin: e.origin.value, username: e.user.value, password: e.pass.value, notes: e.notes.value, aiAccess,
      totp: e.totp ? e.totp.value : undefined,
    });
    if (!res || !res.success) { e.error.textContent = (res && res.error) || 'Could not save'; return; }
    this.closeEditor();
    await this.refresh();
  }

  async _import() {
    const res = await this._api.importFile();
    if (!res || res.canceled) return;
    if (!res.success) { this._feedback.toast(res.error || 'Import failed', 'bad'); return; }
    this._feedback.toast(PasswordsPanel.importSummary(res), 'ok');
    await this.refresh();
  }

  static importSummary({ added = 0, updated = 0, skipped = 0 }) {
    const parts = [`${added} added`];
    if (updated) parts.push(`${updated} updated`);
    if (skipped) parts.push(`${skipped} skipped`);
    return `Imported passwords: ${parts.join(', ')}`;
  }

  async _export() {
    if (!(await this._unlocked())) return;
    const res = await this._api.exportFile();
    if (!res || res.canceled) return;
    if (res.success) this._feedback.toast('Passwords exported. The file is not encrypted: delete it when you are done.', 'ok');
    else this._feedback.toast(res.error || 'Export failed', 'bad');
  }

  _forgetSecrets() {
    this._revealed.clear();
    if (this._el && this._el.editor && !this._el.editor.hidden) this.closeEditor();
  }
}
