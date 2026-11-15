class TerminalTabContext {
  constructor({ getTabViewManager }) {
    this._tvm = getTabViewManager;
  }

  for(tabId) {
    const tvm = this._tvm();
    if (!tvm || tabId == null) return null;
    const tab = tvm.getAllTabs({}).find((candidate) => candidate.id === tabId);
    return tab ? { id: tab.id, title: String(tab.title || ''), url: String(tab.url || '') } : null;
  }
}

module.exports = TerminalTabContext;
