export default class TabStore {
  constructor() {
    this.tabs = new Map();
    this.activeTabId = null;
  }

  static entryFrom(state) {
    return {
      id: state.id,
      tabElement: null,
      url: state.url || '',
      title: state.title || 'New Tab',
      loading: !!state.loading,
      canGoBack: !!state.canGoBack,
      canGoForward: !!state.canGoForward,
      silent: !!state.silent,
      pinned: !!state.pinned,
      keepAlive: !!state.keepAlive,
      hidden: !!state.hidden,
      kind: state.kind || 'user',
      zoomLevel: state.zoomLevel || 1.0,
      favicon: state.favicon || '',
      muted: !!state.muted,
      audible: !!state.audible,
    };
  }

  get(id) {
    return this.tabs.get(id);
  }

  has(id) {
    return this.tabs.has(id);
  }

  set(id, entry) {
    this.tabs.set(id, entry);
  }

  delete(id) {
    this.tabs.delete(id);
  }

  values() {
    return this.tabs.values();
  }

  entries() {
    return this.tabs.entries();
  }

  active() {
    if (this.activeTabId == null) return null;
    return this.tabs.get(this.activeTabId) || null;
  }

  keepAliveCount() {
    return [...this.tabs.values()].filter((t) => t.keepAlive).length;
  }
}
