const ConversationLocator = require('./ConversationLocator');

class ConversationOpener {
  static NOTHING = 'There is nothing to open for this item.';
  static NO_BROWSER = 'The browser is not available.';

  constructor({ locator, tabs, browser, mailbox = null }) {
    this._mailbox = mailbox;
    this._locator = locator;
    this._tabs = tabs;
    this._browser = browser;
  }

  async open(item) {
    if (!this._browser || typeof this._browser.createTab !== 'function') return { success: false, error: ConversationOpener.NO_BROWSER };
    const where = await this._locator.locate(item);
    try {
      if (where.url) return await this._openConversation(where);
      if (await this._openMail(item, where)) return { success: true, opened: 'mail' };
      if (where.tab) return ConversationOpener._shown(this._tabs.show(where.tab.tabId), 'tab');
      return await this._openLink(item, where.partition);
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  async _openConversation({ tab, url, partition }) {
    if (ConversationLocator.shows(tab, url)) return ConversationOpener._shown(this._tabs.show(tab.tabId), 'tab');
    await this._browser.createTab(url, { kind: 'user', partition });
    return { success: true, opened: 'conversation' };
  }

  async _openMail(item, { tab, partition }) {
    if (!this._mailbox || !this._mailbox.handles(item)) return false;
    return this._mailbox.show(item, { tab, partition });
  }

  async _openLink(item, partition) {
    const link = item.url || (item.lastNotification || {}).url || '';
    if (!/^https?:\/\//i.test(link)) return { success: false, error: ConversationOpener.NOTHING };
    await this._browser.createTab(link, { kind: 'user', partition });
    return { success: true, opened: 'link' };
  }

  static _shown(result, opened) {
    return result && result.success === false ? result : { success: true, opened };
  }
}

module.exports = ConversationOpener;
