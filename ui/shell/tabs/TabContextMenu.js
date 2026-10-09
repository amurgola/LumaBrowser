import Clipboard from '../../../core/llm-server/ui/js/dom/Clipboard.js';

export default class TabContextMenu {
  static WIDTH = 220;

  constructor({ store, strip, tabActions, contributors, popupMenu, host }) {
    this._store = store;
    this._strip = strip;
    this._tabs = tabActions;
    this._contributors = contributors;
    this._menu = popupMenu;
    this._host = host;
  }

  async show(x, y, tabId) {
    this._host.hide();
    const tab = this._store.get(tabId);
    if (!tab) return;
    await this._tabs.syncZoom(tabId);
    const { items, map } = await this.build(tab, tabId);
    this._menu.open('context', items, map, { x, y, width: TabContextMenu.WIDTH });
  }

  async build(tab, tabId) {
    const items = [];
    const map = {};
    const add = (action, label, fn, opts = {}) => { items.push(Object.assign({ action, label }, opts)); map[action] = fn; };
    const user = (tab.kind || 'user') === 'user';
    if (user) this._addPageItems(add, items, tab, tabId);
    this._addZoomItems(add, tab, tabId);
    if (user) await this._addPersistItems(add, items, tab, tabId, map);
    if (!tab.pinned) this._addCloseItems(add, items, tabId);
    return { items, map };
  }

  _addPageItems(add, items, tab, tabId) {
    const api = window.tabAPI;
    add('reload', 'Reload', () => api && api.reload(tabId));
    add('duplicate', 'Duplicate', () => { if (tab.url) this._tabs.create(tab.url, { activate: true }); });
    add('copy-url', 'Copy URL', () => { if (tab.url) Clipboard.copyText(tab.url); });
    if (api && typeof api.setMuted === 'function') add('mute', tab.muted ? 'Unmute tab' : 'Mute tab', () => api.setMuted(tabId, !tab.muted));
    items.push({ sep: true });
  }

  _addZoomItems(add, tab, tabId) {
    add('zoom-in', 'Zoom in', () => this._tabs.zoom(tabId, 0.1));
    add('zoom-out', 'Zoom out', () => this._tabs.zoom(tabId, -0.1));
    add('zoom-reset', `Reset zoom (${Math.round(tab.zoomLevel * 100)}%)`, () => this._tabs.zoom(tabId, 0, true));
  }

  async _addPersistItems(add, items, tab, tabId, map) {
    const api = window.tabAPI;
    items.push({ sep: true });
    if (tab.keepAlive) add('persist-off', 'Stop persisting tab', () => { if (api && api.setPersist) api.setPersist(tabId, false); }, { check: true });
    else add('persist-on', 'Persist tab', () => { if (api && api.setPersist) api.setPersist(tabId, true); });
    const extra = await this._contributors.collect(tab, tabId, map);
    if (extra.length) { items.push({ sep: true }); items.push(...extra); }
  }

  _addCloseItems(add, items, tabId) {
    const ids = this._strip.visibleIds();
    const idx = ids.indexOf(tabId);
    const unpinned = (id) => !(this._store.get(id) || {}).pinned;
    const others = ids.filter((id) => id !== tabId && unpinned(id));
    const toRight = idx >= 0 ? ids.slice(idx + 1).filter(unpinned) : [];
    items.push({ sep: true });
    add('close', 'Close tab', () => this._tabs.close(tabId));
    add('close-others', 'Close other tabs', () => { for (const id of others) this._tabs.close(id); }, { disabled: !others.length });
    add('close-right', 'Close tabs to the right', () => { for (const id of toRight) this._tabs.close(id); }, { disabled: !toRight.length });
  }
}
