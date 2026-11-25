import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import CopyButton from '../CopyButton.js';
import FoldGroups from '../general/FoldGroups.js';
import SharingTokensList from './SharingTokensList.js';
import SharingUserPermissions from './SharingUserPermissions.js';

export default class SharingUsersList {
  static FOLD_KEY = 'share-users';

  constructor({ sharingApi, reload, visibleToolGroups }) {
    this._api = sharingApi;
    this._reload = reload;
    this._visibleToolGroups = visibleToolGroups;
    this._wrap = document.getElementById('gsShareUsers');
    this._notice = document.getElementById('gsShareUserNotice');
    this._users = [];
    this._master = {};
    this._openId = null;
  }

  install() {
    if (!this._wrap) return;
    this._wrap.addEventListener('click', (e) => this._onClick(e));
    document.getElementById('gsShareUserAdd').addEventListener('click', () => this._add());
    document.getElementById('gsShareUserName').addEventListener('keydown', (e) => { if (e.key === 'Enter') this._add(); });
  }

  static countText(users) {
    const count = (users || []).length;
    if (!count) return 'None yet';
    return `${count} user${count === 1 ? '' : 's'}`;
  }

  static overridesText(overrides) {
    const o = overrides || {};
    const parts = [];
    const flagCount = Object.keys(o.shareFlags || {}).length;
    if (flagCount) parts.push(`${flagCount} setting${flagCount === 1 ? '' : 's'}`);
    if (Array.isArray(o.llms)) parts.push('chat models');
    if (Array.isArray(o.imageModels)) parts.push('image models');
    if (Array.isArray(o.tools)) parts.push('tools');
    return parts.length ? `Overrides ${parts.join(', ')}` : 'Inherits everything';
  }

  render(cfg) {
    if (!this._wrap) return;
    this._master = cfg || {};
    this._users = (cfg && cfg.users) || [];
    FoldGroups.summarize(SharingUsersList.FOLD_KEY, SharingUsersList.countText(this._users));
    if (!this._users.length) {
      this._wrap.innerHTML = '<div class="gs-list-empty">No users yet.</div>';
      return;
    }
    this._wrap.innerHTML = this._users.map((user) => SharingUsersList.rowHtml(user)).join('');
    if (this._openId) this._openEditor(this._openId);
  }

  static rowHtml(user) {
    const esc = HtmlEscaper.escape;
    const details = [
      SharingUsersList.overridesText(user.overrides),
      SharingTokensList.usageLine(user.usage),
      user.lastUsedAt ? 'used ' + new Date(user.lastUsedAt).toLocaleDateString() : 'never used',
    ].filter(Boolean).join(' · ');
    return `
      <div class="gs-user" data-share-user="${esc(user.id)}">
        <div class="gs-item-card gs-item-row">
          <div class="gs-item-main">
            <div class="gs-item-title">${esc(user.name)} <span class="gs-item-meta">${user.kind === 'group' ? 'Group' : 'Person'}</span></div>
            <div class="gs-item-meta">${esc(details)}</div>
          </div>
          <button class="gs-copy-btn" data-user-link title="Copy the web login link, which carries this user's access key">Copy link</button>
          <button class="gs-copy-btn" data-user-perms>Permissions</button>
          <button class="gs-copy-btn" data-user-rotate title="Issue a new key; the old key and link stop working">New key</button>
          <button class="gs-copy-btn" data-user-remove>Remove</button>
        </div>
        <div data-user-editor></div>
      </div>`;
  }

  async _add() {
    const nameInput = document.getElementById('gsShareUserName');
    const kind = document.getElementById('gsShareUserKind').value;
    const name = (nameInput.value || '').trim();
    if (!name) return nameInput.focus();
    const r = await this._api.createUser({ name, kind });
    if (!r || !r.success) return this._showNotice((r && r.error) || 'Could not add the user.');
    nameInput.value = '';
    this._showLink(`Login link for ${name}`, r.loginUrl);
    return this._reload();
  }

  async _onClick(e) {
    const row = e.target.closest && e.target.closest('[data-share-user]');
    if (!row || !e.target.closest('.gs-item-row')) return;
    const id = row.getAttribute('data-share-user');
    if (e.target.hasAttribute('data-user-link')) await this._copyLink(id, e.target);
    else if (e.target.hasAttribute('data-user-perms')) await this._toggleEditor(id);
    else if (e.target.hasAttribute('data-user-rotate')) await this._rotate(id);
    else if (e.target.hasAttribute('data-user-remove')) await this._remove(id);
  }

  async _copyLink(id, btn) {
    const r = await this._api.userLoginLink(id);
    if (!r || !r.success) return this._showNotice((r && r.error) || 'Could not read the login link.');
    return CopyButton.copy(btn, r.loginUrl);
  }

  async _toggleEditor(id) {
    if (this._openId === id) return this._closeEditor();
    this._openId = id;
    this.render(this._master);
    return undefined;
  }

  async _openEditor(id) {
    const user = this._users.find((entry) => entry.id === id);
    const container = this._editorContainer(id);
    if (!user || !container) { this._openId = null; return; }
    const catalog = await this._catalog();
    new SharingUserPermissions({
      container,
      catalog,
      master: this._master,
      user,
      visibleToolGroups: this._visibleToolGroups,
      onSave: (overrides) => this._save(id, overrides),
      onClose: () => this._closeEditor(),
    }).render();
  }

  async _catalog() {
    if (!this._catalogPromise) this._catalogPromise = this._api.permissionCatalog().catch(() => ({}));
    return this._catalogPromise;
  }

  forgetCatalog() {
    this._catalogPromise = null;
  }

  async _save(id, overrides) {
    const r = await this._api.setUserOverrides(id, overrides);
    if (!r || !r.success) return this._showNotice((r && r.error) || 'Could not save the permissions.');
    this._showNotice('Permissions saved.');
    return this._reload();
  }

  _closeEditor() {
    const container = this._openId ? this._editorContainer(this._openId) : null;
    if (container) container.innerHTML = '';
    this._openId = null;
  }

  async _rotate(id) {
    if (!(await Dialogs.confirm('Issue a new key for this user? Their current key and login link stop working at once.', { okLabel: 'New key' }))) return;
    const r = await this._api.rotateUserKey(id);
    if (!r || !r.success) { this._showNotice((r && r.error) || 'Could not issue a new key.'); return; }
    this._showLink('New login link', r.loginUrl);
    this._reload();
  }

  async _remove(id) {
    const user = this._users.find((entry) => entry.id === id);
    if (!(await Dialogs.confirm(`Remove "${user ? user.name : 'this user'}"? Their key stops working at once.`, { okLabel: 'Remove' }))) return;
    if (this._openId === id) this._openId = null;
    await this._api.removeUser(id);
    this._reload();
  }

  _editorContainer(id) {
    const row = [...this._wrap.querySelectorAll('[data-share-user]')].find((el) => el.getAttribute('data-share-user') === id);
    return row ? row.querySelector('[data-user-editor]') : null;
  }

  _showLink(title, url) {
    if (!this._notice) return;
    const esc = HtmlEscaper.escape;
    this._notice.innerHTML = `<div class="gs-item-card gs-item-details"><div class="gs-row-help">${esc(title)}. Anyone with it signs in as this user.</div>`
      + `<code class="gs-item-code">${esc(url)}</code> <button class="gs-copy-btn" data-notice-copy>Copy</button></div>`;
    this._notice.querySelector('[data-notice-copy]').addEventListener('click', (e) => CopyButton.copy(e.target, url));
  }

  _showNotice(text) {
    if (this._notice) this._notice.innerHTML = `<div class="gs-row-help">${HtmlEscaper.escape(text)}</div>`;
  }
}
