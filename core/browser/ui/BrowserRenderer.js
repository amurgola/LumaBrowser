export default class BrowserRenderer {
  static EVENTS = ['tabCreated', 'tabClosed', 'tabNavigated', 'activeTabChanged', 'urlChanged'];

  constructor() {
    this._listeners = {};
    for (const event of BrowserRenderer.EVENTS) this._listeners[event] = [];
    this._tabs = null;
    this._getActiveTabId = null;
  }

  init(tabs, getActiveTabId) {
    this._tabs = tabs;
    this._getActiveTabId = getActiveTabId;
    console.log('BrowserRenderer: initialized');
  }

  getTabs() {
    if (!this._tabs) return [];
    const activeId = this._getActiveTabId ? this._getActiveTabId() : -1;
    return [...this._tabs.entries()].map(([id, session]) => ({
      id,
      url: session.url || '',
      title: session.title || '',
      active: id === activeId,
    }));
  }

  getActiveTabId() {
    return this._getActiveTabId ? this._getActiveTabId() : 0;
  }

  getTab(tabId) {
    return this._tabs ? this._tabs.get(tabId) || null : null;
  }

  onTabNavigated(callback) {
    return this._subscribe('tabNavigated', callback);
  }

  onTabCreated(callback) {
    return this._subscribe('tabCreated', callback);
  }

  onTabClosed(callback) {
    return this._subscribe('tabClosed', callback);
  }

  onActiveTabChanged(callback) {
    return this._subscribe('activeTabChanged', callback);
  }

  onUrlChanged(callback) {
    return this._subscribe('urlChanged', callback);
  }

  emit(event, ...args) {
    for (const listener of [...(this._listeners[event] || [])]) {
      try { listener(...args); } catch (e) { console.error(`BrowserRenderer event error [${event}]:`, e); }
    }
  }

  _subscribe(event, callback) {
    this._listeners[event].push(callback);
    return () => this._removeListener(event, callback);
  }

  _removeListener(event, callback) {
    const listeners = this._listeners[event];
    const idx = listeners ? listeners.indexOf(callback) : -1;
    if (idx >= 0) listeners.splice(idx, 1);
  }
}
