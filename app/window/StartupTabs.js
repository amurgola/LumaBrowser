const BrowserDataPreferences = require('../../core/browser-data/BrowserDataPreferences');

class StartupTabs {
  static LLM_TAB_DELAY_MS = 1500;
  static RESTORE_DELAY_MS = 3000;

  constructor({ getTabViewManager, llmServerService, db, bookmarkService, log = console, setImmediateFn = setImmediate, setTimeoutFn = setTimeout }) {
    this._tvm = getTabViewManager;
    this._llm = llmServerService;
    this._db = db;
    this._bookmarks = bookmarkService;
    this._log = log;
    this._setImmediate = setImmediateFn;
    this._setTimeout = setTimeoutFn;
  }

  open() {
    const tvm = this._tvm();
    if (!tvm || tvm.tabs.size !== 0) return false;
    const llmAsDefault = this._llm.isEnabled() && this._llm.getOpenTabOnLoad();
    const startPageUrl = this._db.get('startPageUrl', BrowserDataPreferences.DEFAULT_START_PAGE);
    if (llmAsDefault) this._setImmediate(() => this._spawnLlmFirst(startPageUrl));
    else this._setImmediate(() => this._spawnHomeFirst(startPageUrl));
    this._setTimeout(() => this._restorePersisted(), StartupTabs.RESTORE_DELAY_MS);
    return true;
  }

  _spawnLlmFirst(startPageUrl) {
    const tvm = this._tvm();
    if (!tvm || tvm.tabs.size !== 0) return;
    this._llm.ensurePinnedTab({ activate: true });
    tvm.createTab(startPageUrl, { activate: false });
    this._openStartupBookmarks(tvm);
  }

  _spawnHomeFirst(startPageUrl) {
    const tvm = this._tvm();
    if (!tvm) return;
    tvm.createTab(startPageUrl);
    this._openStartupBookmarks(tvm);
    if (!this._llm.isEnabled()) return;
    this._setTimeout(() => this._llm.ensurePinnedTab({ activate: false }), StartupTabs.LLM_TAB_DELAY_MS);
  }

  _openStartupBookmarks(tvm) {
    try {
      for (const bookmark of this._bookmarks.getStartupBookmarks()) {
        if (bookmark.url) tvm.createTab(bookmark.url, { activate: false });
      }
    } catch (err) {
      this._log.warn('Failed to open startup bookmarks:', err.message);
    }
  }

  _restorePersisted() {
    const tvm = this._tvm();
    if (!tvm) return;
    try {
      const restored = tvm.restorePersistedTabs();
      if (restored) this._log.log(`Restored ${restored} persisted tab(s) in the background`);
    } catch (err) {
      this._log.warn('Persisted tab restore failed:', err.message);
    }
    tvm.startKeepAliveSweep();
  }
}

module.exports = StartupTabs;
