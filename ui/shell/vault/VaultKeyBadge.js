export default class VaultKeyBadge {
  static WIDTH = 300;

  constructor({ store, popupMenu, openPasswords }) {
    this._store = store;
    this._menu = popupMenu;
    this._openPasswords = openPasswords;
    this._logins = [];
    this._seq = 0;
    this.el = null;
  }

  install() {
    this.el = document.getElementById('urlBarKey');
    if (this.el) this.el.addEventListener('click', () => this.openMenu());
  }

  async update(tab) {
    if (!this.el) return;
    const seq = ++this._seq;
    let logins = [];
    if (tab && /^https?:\/\//i.test(tab.url || '') && (tab.kind || 'user') === 'user' && window.vaultAPI) {
      try { logins = await window.vaultAPI.loginsForTab(tab.id); } catch (_) { logins = []; }
    }
    if (seq !== this._seq) return;
    this._logins = Array.isArray(logins) ? logins : [];
    this.el.hidden = !this._logins.length;
    const title = this._logins.length === 1 ? 'Saved password for this site' : `${this._logins.length} saved passwords for this site`;
    this.el.title = title;
    this.el.setAttribute('aria-label', title);
  }

  openMenu() {
    const tab = this._store.active();
    if (!tab || !this._logins.length || !window.vaultAPI) return;
    const items = [];
    const map = {};
    this._logins.forEach((l, i) => {
      const action = `key-login-${i}`;
      map[action] = () => window.vaultAPI.fill(tab.id, l.id);
      items.push({ action, label: `Fill ${l.username || '(no username)'}`, hint: l.related ? l.host : '' });
    });
    items.push({ sep: true });
    map['key-manage'] = () => this._openPasswords();
    items.push({ action: 'key-manage', label: 'Manage passwords' });
    const r = this.el.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.right - VaultKeyBadge.WIDTH, window.innerWidth - VaultKeyBadge.WIDTH));
    this._menu.open('context', items, map, { x, y: r.bottom + 6, width: VaultKeyBadge.WIDTH });
  }
}
