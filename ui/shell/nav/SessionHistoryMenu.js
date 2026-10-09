export default class SessionHistoryMenu {
  static WIDTH = 340;

  static LABEL_CHARS = 70;

  constructor({ store, popupMenu }) {
    this._store = store;
    this._menu = popupMenu;
  }

  async show(x, y) {
    const tabId = this._store.activeTabId;
    if (tabId === null || !window.tabAPI || !window.tabAPI.getHistory) return;
    const res = await window.tabAPI.getHistory(tabId);
    if (!res || !res.success || !Array.isArray(res.entries) || res.entries.length <= 1) return;
    const { items, map } = SessionHistoryMenu.build(res, (index) => window.tabAPI.goToIndex(tabId, index));
    this._menu.open('context', items, map, { x, y, width: SessionHistoryMenu.WIDTH });
  }

  static build(res, goTo) {
    const items = [];
    const map = {};
    for (const e of res.entries.slice().reverse()) {
      const action = `hist-${e.index}`;
      map[action] = () => goTo(e.index);
      items.push({
        action,
        label: (e.title || e.url || '').slice(0, SessionHistoryMenu.LABEL_CHARS),
        check: e.index === res.activeIndex,
        checkLabel: 'Current',
      });
    }
    return { items, map };
  }
}
