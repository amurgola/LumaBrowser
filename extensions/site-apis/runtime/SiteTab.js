const Faults = require('../spec/Faults');
const RunFault = require('./RunFault');

class SiteTab {
  static VIEWPORT = Object.freeze({ x: 0, y: 0, width: 1280, height: 900 });
  static GONE_PATTERN = /not found|destroyed|no such tab/i;

  constructor({ browser, site, logger = console }) {
    this._browser = browser;
    this._site = site;
    this._logger = logger;
    this._tabId = null;
    this._queue = Promise.resolve();
  }

  get tabId() {
    return this._tabId;
  }

  withLock(fn) {
    const turn = this._queue.then(fn, fn);
    this._queue = turn.then(() => undefined, () => undefined);
    return turn;
  }

  async ensure() {
    if (!this._browser) throw RunFault.make(Faults.BROWSER_UNAVAILABLE, 'The browser is not available in this process');
    if (this._tabId != null && await this._alive()) return this._tabId;
    this._tabId = null;
    this._tabId = await this._create();
    return this._tabId;
  }

  noteReply(reply) {
    if (reply && reply.success === false && SiteTab.GONE_PATTERN.test(String(reply.error || ''))) this._tabId = null;
  }

  async close() {
    const id = this._tabId;
    this._tabId = null;
    if (id == null) return;
    try { await this._browser.closeTab(id); } catch (_) {}
  }

  async _create() {
    let created;
    try {
      created = await this._browser.createTab(this._site.startUrl || this._site.origin, {
        partition: this._site.partition,
        silent: true,
        kind: 'user',
        activate: false,
        title: `Site API: ${this._site.name || this._site.id}`,
      });
    } catch (err) {
      throw RunFault.make(Faults.SITE_UNAVAILABLE, `Could not open a tab for ${this._site.id}: ${err.message}`);
    }
    const tab = created && created.success !== false ? created.tab : null;
    const id = tab ? (tab.id != null ? tab.id : tab.tabId) : null;
    if (id == null) throw RunFault.make(Faults.SITE_UNAVAILABLE, `Could not open a tab for ${this._site.id}: ${(created && created.error) || 'no tab'}`);
    this._size(id);
    return id;
  }

  _size(id) {
    try {
      const manager = typeof this._browser.getTabManager === 'function' ? this._browser.getTabManager() : null;
      const entry = manager && manager.tabViewManager && typeof manager.tabViewManager.getEntry === 'function' ? manager.tabViewManager.getEntry(id) : null;
      if (entry && entry.view && typeof entry.view.setBounds === 'function') entry.view.setBounds({ ...SiteTab.VIEWPORT });
    } catch (err) {
      this._logger.warn(`site-apis: could not size the replay tab: ${err.message}`);
    }
  }

  async _alive() {
    try {
      const listed = await this._browser.getTabs({ includeSilent: true });
      const tabs = (listed && listed.tabs) || (Array.isArray(listed) ? listed : []);
      return tabs.some((tab) => (tab.id != null ? tab.id : tab.tabId) === this._tabId);
    } catch (_) {
      return false;
    }
  }
}

module.exports = SiteTab;
