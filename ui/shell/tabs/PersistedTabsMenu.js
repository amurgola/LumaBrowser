export default class PersistedTabsMenu {
  static WIDTH = 260;

  constructor({ store, popupMenu }) {
    this._store = store;
    this._menu = popupMenu;
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
    const { items, map } = PersistedTabsMenu.build(list);
    const r = btn.getBoundingClientRect();
    this._menu.open('context', items, map, { x: r.left, y: r.bottom + 4, width: PersistedTabsMenu.WIDTH });
  }

  static build(list) {
    const items = [];
    const map = {};
    for (const t of list) {
      const action = `persisted-${t.id}`;
      map[action] = () => (t.hidden ? window.tabAPI.show(t.id) : window.tabAPI.switch(t.id));
      items.push({ action, label: t.title || t.url || 'Tab', hint: t.hidden ? 'background' : '' });
    }
    return { items, map };
  }
}
