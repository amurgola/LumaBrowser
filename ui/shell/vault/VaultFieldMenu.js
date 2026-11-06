export default class VaultFieldMenu {
  static WIDTH = 300;

  static MAX_ROWS = 6;

  constructor({ store, popupMenu, host, bounds, openPasswords }) {
    this._store = store;
    this._menu = popupMenu;
    this._host = host;
    this._bounds = bounds;
    this._openPasswords = openPasswords;
    this._openFor = null;
    host.onHide(() => {
      if (this._openFor != null) this._tellTab(this._openFor, { open: false, active: false });
      this._openFor = null;
    });
  }

  get openFor() {
    return this._openFor;
  }

  install() {
    const api = window.vaultAPI;
    if (!api) return;
    api.onField((p) => this.show(p));
    api.onFieldGone((p) => { if (p && p.tabId === this._openFor) this._host.hide(); });
    if (typeof api.onFieldKey === 'function') api.onFieldKey((p) => this.onKey(p));
  }

  show(p) {
    if (!p || p.tabId !== this._store.activeTabId || !window.vaultAPI) return;
    const { items, map } = VaultFieldMenu.build(p, {
      fill: (id) => window.vaultAPI.fill(p.tabId, id),
      fillProfile: (id) => window.vaultAPI.fillProfile(p.tabId, id),
      fillOtp: (id) => window.vaultAPI.fillOtp(p.tabId, id),
      generate: () => window.vaultAPI.fillGenerated(p.tabId),
      manage: () => this._openPasswords(),
    });
    if (!items.length) return;
    const at = VaultFieldMenu.position(p, this._bounds && this._bounds.lastSent);
    this._menu.open('context', items, map, { x: at.x, y: at.y, width: VaultFieldMenu.WIDTH });
    this._openFor = p.tabId;
    this._tellTab(p.tabId, { open: true, active: false });
  }

  onKey(p) {
    if (!p || p.tabId !== this._openFor) return;
    const tabId = this._openFor;
    this._menu.handleKeydown({ key: p.key, preventDefault() {} });
    if (this._openFor === tabId) this._tellTab(tabId, { open: true, active: this._menu.active >= 0 });
  }

  _tellTab(tabId, state) {
    if (window.vaultAPI && typeof window.vaultAPI.menuState === 'function') window.vaultAPI.menuState(tabId, state);
  }

  static position(p, viewBounds) {
    const base = viewBounds || { x: 0, y: 0 };
    const zoom = Number(p.zoom) || 1;
    const r = p.rect || { x: 0, y: 0, width: 0, height: 0 };
    return { x: Math.round(base.x + r.x * zoom), y: Math.round(base.y + (r.y + r.height) * zoom + 2) };
  }

  static build(p, actions) {
    const items = [];
    const map = {};
    (p.matches || []).slice(0, VaultFieldMenu.MAX_ROWS).forEach((m, i) => {
      const action = `vault-login-${i}`;
      map[action] = () => (p.otp ? actions.fillOtp(m.id) : actions.fill(m.id));
      const who = m.username || '(no username)';
      items.push({ action, label: p.otp ? `2FA code for ${who}` : who, hint: m.related ? m.host : '' });
    });
    (p.profiles || []).slice(0, VaultFieldMenu.MAX_ROWS).forEach((prof, i) => {
      const action = `vault-profile-${i}`;
      map[action] = () => actions.fillProfile(prof.id);
      items.push({ action, label: prof.summary || prof.title || 'Saved address', hint: prof.title || '' });
    });
    if (p.canGenerate) {
      if (items.length) items.push({ sep: true });
      map['vault-generate'] = () => actions.generate();
      items.push({ action: 'vault-generate', label: 'Use a strong password' });
    }
    if (items.length) {
      items.push({ sep: true });
      map['vault-manage'] = () => actions.manage();
      items.push({ action: 'vault-manage', label: (p.profiles || []).length ? 'Manage addresses' : 'Manage passwords' });
    }
    return { items, map };
  }
}
