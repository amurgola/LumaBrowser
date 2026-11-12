const NotificationClassifier = require('../inbox/NotificationClassifier');
const SnapshotExcerpt = require('./SnapshotExcerpt');

class ConversationReader {
  static LOAD_TIMEOUT_MS = 20000;
  static SETTLE_MS = 2500;
  static VIEWPORT = Object.freeze({ x: 0, y: 0, width: 1280, height: 900 });
  static AUTOMATION_HOST = 'automation';
  static SLACK_TEAM = /\/client\/([A-Z0-9]+)/;

  constructor({ tabs, browser, snapshots, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
    this._tabs = tabs;
    this._browser = browser;
    this._snapshots = snapshots;
    this._sleep = sleep;
    this._queue = Promise.resolve();
  }

  available() {
    return !!(this._browser && typeof this._browser.getSource === 'function');
  }

  stored(item) {
    const snapshot = item ? this._snapshots.get(item.id) : null;
    return snapshot ? { ...snapshot, fresh: snapshot.sourceAt === (item.lastAt || '') } : null;
  }

  forItems(items) {
    return this._snapshots.forThreads((items || []).map((i) => i.id));
  }

  read(item, { force = false } = {}) {
    const turn = this._queue.then(() => this._read(item, force), () => this._read(item, force));
    this._queue = turn.then(() => undefined, () => undefined);
    return turn;
  }

  async _read(item, force) {
    if (!item) return { snapshot: null, reason: 'Activity item not found.' };
    const kept = this.stored(item);
    if (kept && kept.fresh && !force) return { snapshot: kept };
    if (!this.available()) return { snapshot: kept, reason: 'The browser is not available.' };
    const tab = this._tabFor(item);
    const url = ConversationReader.conversationUrl(item, tab);
    let read = null;
    if (url) read = await this._readAddress(url, ConversationReader._partition(item, tab));
    if (!read && tab) read = await this._readTab(tab, item);
    if (!read) {
      const reason = tab ? 'The tab is showing something else, so there was nothing more to read.' : 'No signed-in tab for this item is open.';
      return { snapshot: kept, reason };
    }
    return { snapshot: { ...this._snapshots.save({ threadId: item.id, scope: read.scope, url: read.url, text: read.text, sourceAt: item.lastAt || '' }), fresh: true } };
  }

  static conversationUrl(item, tab) {
    const last = item.lastNotification || {};
    const own = (item.context && item.context.conversationUrl) || '';
    if (/^https?:\/\//i.test(own)) return own;
    const url = item.url || last.url || '';
    const isLink = /^https?:\/\//i.test(url);
    if (isLink && (last.host === ConversationReader.AUTOMATION_HOST || item.app === 'clickup')) return url;
    if (item.app === 'slack' && String(item.threadKey || '').startsWith('channel:')) {
      const team = String((tab && tab.url) || url).match(ConversationReader.SLACK_TEAM);
      if (team) return `https://app.slack.com/client/${team[1]}/${item.threadKey.slice('channel:'.length)}`;
    }
    return null;
  }

  _tabFor(item) {
    let tabs = [];
    try { tabs = this._tabs.persisted(); } catch (_) { tabs = []; }
    const ofApp = tabs.filter((t) => NotificationClassifier.appFor(t.host) === item.app);
    const partition = (item.lastNotification || {}).partition;
    if (partition) return ofApp.find((t) => t.partition === partition) || tabs.find((t) => t.partition === partition) || null;
    return ofApp.length === 1 ? ofApp[0] : null;
  }

  static _partition(item, tab) {
    return (item.lastNotification || {}).partition || (tab && tab.partition) || undefined;
  }

  async _readAddress(url, partition) {
    let tabId = null;
    try {
      const created = await this._browser.createTab(url, { partition, silent: true, kind: 'user', activate: false, title: 'Hub: reading a conversation' });
      const tab = created && created.success !== false ? (created.tab || created) : null;
      tabId = tab ? (tab.id != null ? tab.id : tab.tabId) : null;
      if (tabId == null) return null;
      this._size(tabId);
      if (typeof this._browser.waitForLoad === 'function') await this._browser.waitForLoad(tabId, ConversationReader.LOAD_TIMEOUT_MS);
      await this._sleep(ConversationReader.SETTLE_MS);
      const text = SnapshotExcerpt.tail(await this._source(tabId));
      return text ? { scope: 'conversation', url, text } : null;
    } catch (_) {
      return null;
    } finally {
      if (tabId != null) { try { await this._browser.closeTab(tabId); } catch (_) {} }
    }
  }

  async _readTab(tab, item) {
    try {
      const text = SnapshotExcerpt.around(await this._source(tab.tabId), SnapshotExcerpt.needles(item));
      return text ? { scope: 'tab', url: tab.url || '', text } : null;
    } catch (_) {
      return null;
    }
  }

  async _source(tabId) {
    const reply = await this._browser.getSource(tabId, { type: 'markdown' });
    return reply && reply.success !== false && typeof reply.source === 'string' ? reply.source : '';
  }

  _size(tabId) {
    try {
      const manager = typeof this._browser.getTabManager === 'function' ? this._browser.getTabManager() : null;
      const entry = manager && manager.tabViewManager && typeof manager.tabViewManager.getEntry === 'function' ? manager.tabViewManager.getEntry(tabId) : null;
      if (entry && entry.view && typeof entry.view.setBounds === 'function') entry.view.setBounds({ ...ConversationReader.VIEWPORT });
    } catch (_) {}
  }
}

module.exports = ConversationReader;
