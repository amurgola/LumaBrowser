class TabPageAccess {
  static async urlOf(tabManager, tabId) {
    try {
      const wc = TabPageAccess._webContentsOf(tabManager, tabId);
      if (wc && typeof wc.getURL === 'function') return wc.getURL();
      if (typeof tabManager.getAllTabs === 'function') return await TabPageAccess._listedUrl(tabManager, tabId);
    } catch {}
    return null;
  }

  static async run(tabManager, tabId, script) {
    if (!tabManager || typeof tabManager.updateTab !== 'function') return null;
    try {
      const reply = await tabManager.updateTab(tabId, { type: 'executeJs', payload: script });
      const out = reply && reply.success && reply.data ? reply.data.result : null;
      return out && out.success ? out : null;
    } catch {
      return null;
    }
  }

  static _webContentsOf(tabManager, tabId) {
    const tvm = tabManager.tabViewManager;
    const entry = tvm && tvm.getEntry && tvm.getEntry(tabId);
    return entry ? entry.webContents : null;
  }

  static async _listedUrl(tabManager, tabId) {
    const reply = await tabManager.getAllTabs({ includeSilent: true });
    const tab = reply && reply.success && (reply.tabs || []).find((t) => t.id === tabId);
    return tab ? tab.url : null;
  }
}

module.exports = TabPageAccess;
