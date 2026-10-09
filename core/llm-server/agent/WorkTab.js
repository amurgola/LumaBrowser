const BrowserTools = require('../../llm-service/BrowserTools');

class WorkTab {
  static LAZY_DEFAULT_TAB = -1;
  static BLANK_URL = 'about:blank';
  static ON_TAB_TOOLS = new Set(
    BrowserTools.TOOL_DEFINITIONS.filter((tool) => tool.params && 'tabId' in tool.params).map((tool) => tool.name),
  );

  static needsWorkTab(tool, params) {
    if (params && params.tabId != null && params.tabId !== WorkTab.LAZY_DEFAULT_TAB) return false;
    return WorkTab.ON_TAB_TOOLS.has(tool);
  }

  constructor(browserService, options) {
    this._browserService = browserService;
    this._requestedTabId = options.requestedTabId;
    this._lazy = !!options.lazy;
    this._onWorkTab = options.onWorkTab;
    this._id = null;
    this._created = false;
    this._announced = false;
  }

  get id() {
    return this._id;
  }

  get created() {
    return this._created;
  }

  get lazy() {
    return this._lazy;
  }

  get promptTabId() {
    return this._lazy ? WorkTab.LAZY_DEFAULT_TAB : this._id;
  }

  async open() {
    if (this._requestedTabId != null) {
      this._id = this._requestedTabId;
      return;
    }
    if (this._lazy) return;
    try {
      const result = await this._browserService.createTab(WorkTab.BLANK_URL, { activate: false });
      this._id = result.tab?.id ?? 0;
      this._created = true;
      this._announce(this._id);
    } catch (_) {
      this._id = 0;
    }
  }

  async ensure() {
    if (this._id != null) return this._id;
    try {
      const result = await this._browserService.createTab(WorkTab.BLANK_URL, { activate: false });
      if (result && result.tab && result.tab.id != null) {
        this._id = result.tab.id;
        this._created = true;
        this._announce(this._id);
      } else {
        this._id = 0;
      }
    } catch (_) {
      this._id = 0;
    }
    return this._id;
  }

  async closeIfOwned() {
    if (!this._created) return;
    try { await this._browserService.closeTab(this._id); } catch (_) {}
  }

  _announce(id) {
    if (this._announced || id == null || typeof this._onWorkTab !== 'function') return;
    this._announced = true;
    try { this._onWorkTab(id); } catch (_) {}
  }
}

module.exports = WorkTab;
