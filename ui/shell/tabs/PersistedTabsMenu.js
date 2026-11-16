import FaviconCache from '../favicons/FaviconCache.js';

export default class PersistedTabsMenu {
  static WIDTH = 340;

  static GROUPS = [
    { heading: 'In the background', holds: (tab) => !!tab.hidden },
    { heading: 'Open tabs', holds: (tab) => !tab.hidden },
  ];

  constructor({ store, popupMenu, favicons }) {
    this._store = store;
    this._menu = popupMenu;
    this._favicons = favicons;
  }

  refreshButton() {
    const btn = document.getElementById('persistedTabsBtn');
    if (!btn) return;
    const count = this._store.keepAliveCount();
    const countEl = document.getElementById('persistedTabsCount');
    if (countEl) countEl.textContent = String(count);
    btn.hidden = count === 0;
  }

  async show() {
    const btn = document.getElementById('persistedTabsBtn');
    if (!btn || !window.tabAPI || !window.tabAPI.getPersisted) return;
    let list = [];
    try { list = await window.tabAPI.getPersisted(); } catch (_) { list = []; }
    if (!list.length) { this.refreshButton(); return; }
    const { items, map } = PersistedTabsMenu.build(list, this._favicons);
    const r = btn.getBoundingClientRect();
    this._menu.open('context', items, map, { x: r.left, y: r.bottom + 4, width: PersistedTabsMenu.WIDTH });
  }

  static build(list, favicons) {
    const items = [];
    const map = {};
    for (const group of PersistedTabsMenu.GROUPS) {
      const tabs = list.filter(group.holds);
      if (!tabs.length) continue;
      if (items.length) items.push({ sep: true });
      items.push({ heading: group.heading });
      for (const tab of tabs) items.push(PersistedTabsMenu._row(tab, map, favicons));
    }
    return { items, map };
  }

  static _row(tab, map, favicons) {
    const action = `persisted-${tab.id}`;
    map[action] = () => (tab.hidden ? window.tabAPI.show(tab.id) : window.tabAPI.switch(tab.id));
    return {
      action,
      label: tab.title || tab.url || 'Tab',
      sub: FaviconCache.host(tab.url) || tab.url || '',
      icon: favicons ? favicons.html(tab.url, tab.title) : '',
    };
  }
}
