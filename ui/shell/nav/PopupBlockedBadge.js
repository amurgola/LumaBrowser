export default class PopupBlockedBadge {
  static WIDTH = 360;

  static LABEL_CHARS = 60;

  constructor({ store, popupMenu }) {
    this._store = store;
    this._menu = popupMenu;
    this.el = null;
  }

  install() {
    this.el = document.getElementById('urlBarPopups');
    if (this.el) this.el.addEventListener('click', () => this.openMenu());
  }

  update(tab) {
    if (!this.el) return;
    const count = tab && Array.isArray(tab.blockedPopups) ? tab.blockedPopups.length : 0;
    this.el.hidden = !count;
    const title = count === 1 ? 'Pop-up blocked' : `${count} pop-ups blocked`;
    this.el.title = title;
    this.el.setAttribute('aria-label', title);
  }

  openMenu() {
    const tab = this._store.active();
    if (!tab || !Array.isArray(tab.blockedPopups) || !tab.blockedPopups.length || !window.tabAPI) return;
    const { items, map } = PopupBlockedBadge.build(tab, {
      open: (index) => window.tabAPI.openBlockedPopup(tab.id, index),
      allow: () => window.tabAPI.allowPopups(tab.id),
    });
    const r = this.el.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.right - PopupBlockedBadge.WIDTH, window.innerWidth - PopupBlockedBadge.WIDTH));
    this._menu.open('context', items, map, { x, y: r.bottom + 6, width: PopupBlockedBadge.WIDTH });
  }

  static hostOf(url) {
    try { return new URL(url).host || url; } catch (_) { return url || ''; }
  }

  static build(tab, actions) {
    const items = [];
    const map = {};
    tab.blockedPopups.forEach((url, index) => {
      const action = `popup-${index}`;
      if (url) map[action] = () => actions.open(index);
      items.push({
        action,
        label: url ? `Open ${url.slice(0, PopupBlockedBadge.LABEL_CHARS)}` : 'Blank pop-up (cannot be reopened)',
        disabled: !url,
      });
    });
    items.push({ sep: true });
    map['popup-allow'] = () => actions.allow();
    items.push({ action: 'popup-allow', label: `Always allow pop-ups from ${PopupBlockedBadge.hostOf(tab.url)}` });
    return { items, map };
  }
}
