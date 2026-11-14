export default class SiteInfoMenu {
  static WIDTH = 300;

  static LABELS = { camera: 'Camera', microphone: 'Microphone', notifications: 'Notifications', popups: 'Pop-ups and redirects' };

  static NEXT = { ask: 'allow', allow: 'block', block: 'ask' };

  static WORDS = { ask: 'Ask', allow: 'Allow', block: 'Block' };

  constructor({ store, popupMenu, openSettings, host }) {
    this._store = store;
    this._menu = popupMenu;
    this._openSettings = openSettings;
    this._host = host;
    this._shown = null;
    this.el = null;
    if (host) host.onHide(() => { this._shown = null; });
  }

  install() {
    this.el = document.getElementById('urlBarSecurity');
    if (!this.el) return;
    this.el.setAttribute('role', 'button');
    this.el.tabIndex = 0;
    this.el.addEventListener('click', () => this.open());
    this.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(); } });
  }

  async open() {
    const tab = this._store.active();
    if (!tab || !window.ipcBridge) return;
    const info = await window.ipcBridge.invoke('core.siteInfo.get', tab.id);
    if (!info || !info.success) return;
    const change = async (channel, ...args) => { await window.ipcBridge.invoke(channel, tab.id, ...args, info.origin); this.open(); };
    const { items, map } = SiteInfoMenu.build(info, {
      setPermission: (kind, value) => change('core.siteInfo.setPermission', kind, value),
      setAdblock: (off) => change('core.siteInfo.setAdblock', off),
      clearData: () => change('core.siteInfo.clearData'),
      settings: () => this._openSettings(),
    });
    const r = this.el.getBoundingClientRect();
    this._menu.open('context', items, map, { x: Math.max(0, r.left - 6), y: r.bottom + 10, width: SiteInfoMenu.WIDTH });
    this._shown = { tabId: tab.id, origin: info.origin };
  }

  onNavigated(tabId, url) {
    if (!this._shown || this._shown.tabId !== tabId || SiteInfoMenu.originOf(url) === this._shown.origin) return;
    if (this._host) this._host.hide();
  }

  static originOf(url) {
    try { return new URL(url).origin; } catch (_) { return null; }
  }

  static build(info, actions) {
    const items = [];
    const map = {};
    items.push({ action: 'si-conn', label: info.secure ? `Connection to ${info.host} is secure` : `Not secure: ${info.host} uses plain HTTP`, disabled: true });
    items.push({ sep: true });
    for (const kind of Object.keys(SiteInfoMenu.LABELS)) {
      const now = (info.permissions && info.permissions[kind]) || 'ask';
      const action = `si-perm-${kind}`;
      map[action] = () => actions.setPermission(kind, SiteInfoMenu.NEXT[now]);
      items.push({ action, label: SiteInfoMenu.LABELS[kind], hint: SiteInfoMenu.WORDS[now] });
    }
    items.push({ sep: true });
    const ad = info.adblock || {};
    if (ad.available) {
      map['si-adblock'] = () => actions.setAdblock(ad.on);
      items.push({ action: 'si-adblock', label: 'Block ads and trackers here', hint: ad.on ? 'On' : 'Off' });
    } else {
      items.push({ action: 'si-adblock', label: 'Ad blocker', hint: 'Off everywhere', disabled: true });
    }
    const n = Number(info.cookies) || 0;
    map['si-clear'] = () => actions.clearData();
    items.push({ action: 'si-clear', label: 'Delete cookies and site data', hint: `${n} cookie${n === 1 ? '' : 's'}` });
    items.push({ sep: true });
    map['si-settings'] = () => actions.settings();
    items.push({ action: 'si-settings', label: 'All site settings' });
    return { items, map };
  }
}
