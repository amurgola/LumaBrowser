class WorkTabs {
  constructor({ browser = null, logger = console } = {}) {
    this._browser = browser;
    this._logger = logger;
    this._byConversation = new Map();
  }

  get available() {
    return !!(this._browser && typeof this._browser.createTab === 'function');
  }

  async ensure(conversationId, site, knownTabId = null) {
    if (!this.available || !site) return null;
    const candidate = knownTabId != null ? knownTabId : this._byConversation.get(conversationId);
    if (candidate != null && await this.isOpen(candidate)) {
      this._byConversation.set(conversationId, candidate);
      return candidate;
    }
    return this._open(conversationId, site);
  }

  async isOpen(tabId) {
    if (tabId == null || !this._browser || typeof this._browser.getTabs !== 'function') return false;
    try {
      const result = await this._browser.getTabs();
      const tabs = Array.isArray(result) ? result : (result && Array.isArray(result.tabs) ? result.tabs : []);
      return tabs.some((tab) => tab && Number(tab.id) === Number(tabId));
    } catch (_) {
      return false;
    }
  }

  async close(conversationId, tabId = null) {
    const id = tabId != null ? tabId : this._byConversation.get(conversationId);
    this._byConversation.delete(conversationId);
    if (id == null || !this._browser || typeof this._browser.closeTab !== 'function') return false;
    try { await this._browser.closeTab(id); return true; } catch (_) { return false; }
  }

  async dispose() {
    const ids = [...this._byConversation.entries()];
    this._byConversation.clear();
    for (const [, id] of ids) {
      try { await this._browser.closeTab(id); } catch (_) {}
    }
  }

  async _open(conversationId, site) {
    try {
      const result = await this._browser.createTab(site.startUrl || site.origin, { partition: site.partition, activate: false });
      const id = result && result.tab && result.tab.id != null ? result.tab.id : (result && result.id != null ? result.id : null);
      if (id == null) return null;
      this._byConversation.set(conversationId, id);
      return id;
    } catch (err) {
      this._log(`site-apis builder: could not open a work tab for ${site.origin}: ${err && err.message}`);
      return null;
    }
  }

  _log(text) {
    try { if (this._logger && typeof this._logger.warn === 'function') this._logger.warn(text); } catch (_) {}
  }
}

module.exports = WorkTabs;
