class HiddenTab {
  static LOAD_TIMEOUT_MS = 20000;
  static READY_TIMEOUT_MS = 15000;
  static TITLE = 'Hub: reading a conversation';

  static async use(browser, { url, partition, ready = null }, read) {
    let tabId = null;
    try {
      const created = await browser.createTab(url, { partition, silent: true, kind: 'user', activate: false, title: HiddenTab.TITLE });
      const tab = created && created.success !== false ? (created.tab || created) : null;
      tabId = tab ? (tab.id != null ? tab.id : tab.tabId) : null;
      if (tabId == null) return null;
      if (typeof browser.waitForLoad === 'function') await browser.waitForLoad(tabId, HiddenTab.LOAD_TIMEOUT_MS);
      if (ready && typeof browser.waitFor === 'function') await browser.waitFor(tabId, { selector: ready, timeout: HiddenTab.READY_TIMEOUT_MS });
      return await read(tabId);
    } catch (_) {
      return null;
    } finally {
      if (tabId != null) { try { await browser.closeTab(tabId); } catch (_) {} }
    }
  }
}

module.exports = HiddenTab;
