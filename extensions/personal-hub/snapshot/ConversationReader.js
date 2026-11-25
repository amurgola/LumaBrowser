const ConversationLocator = require('./ConversationLocator');
const HiddenTab = require('./HiddenTab');
const SnapshotExcerpt = require('./SnapshotExcerpt');

class ConversationReader {
  static SETTLE_MS = 2500;

  constructor({ locator, browser, snapshots, mailbox = null, opensMail = () => false, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
    this._mailbox = mailbox;
    this._opensMail = opensMail;
    this._locator = locator;
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
    const { tab, url, partition, pane } = await this._locator.locate(item);
    let read = null;
    if (url) read = (ConversationLocator.shows(tab, url) && await this._readShown(tab, url, pane)) || await this._readAddress(url, partition, pane);
    if (!read && !url) read = await this._readMail(item, tab, partition);
    if (!read && tab) read = await this._readTab(tab, item);
    if (!read) {
      const reason = tab ? 'The tab is showing something else, so there was nothing more to read.' : 'No signed-in tab for this item is open.';
      return { snapshot: kept, reason };
    }
    return { snapshot: { ...this._snapshots.save({ threadId: item.id, scope: read.scope, url: read.url, text: read.text, sourceAt: item.lastAt || '' }), fresh: true } };
  }

  async _readShown(tab, url, pane) {
    try {
      const text = SnapshotExcerpt.tail(await this._source(tab.tabId, pane));
      return text ? { scope: 'conversation', url, text } : null;
    } catch (_) {
      return null;
    }
  }

  async _readAddress(url, partition, pane) {
    const text = await HiddenTab.use(this._browser, { url, partition, ready: pane }, async (tabId) => {
      await this._sleep(ConversationReader.SETTLE_MS);
      return SnapshotExcerpt.tail(await this._conversation(tabId, pane));
    });
    return text ? { scope: 'conversation', url, text } : null;
  }

  async _readMail(item, tab, partition) {
    if (!this._mailbox || !this._mailbox.handles(item) || !this._opensMail()) return null;
    const mail = await this._mailbox.read(item, { tab, partition });
    return mail ? { scope: 'mail', url: mail.url, text: SnapshotExcerpt.head(mail.text) } : null;
  }

  async _readTab(tab, item) {
    try {
      const text = SnapshotExcerpt.around(await this._source(tab.tabId), SnapshotExcerpt.needles(item));
      return text ? { scope: 'tab', url: tab.url || '', text } : null;
    } catch (_) {
      return null;
    }
  }

  async _conversation(tabId, pane) {
    return (pane ? await this._source(tabId, pane) : '') || this._source(tabId);
  }

  async _source(tabId, selector = null) {
    const reply = await this._browser.getSource(tabId, selector ? { type: 'text', selector } : { type: 'text' });
    return reply && reply.success !== false && typeof reply.source === 'string' ? reply.source : '';
  }
}

module.exports = ConversationReader;
