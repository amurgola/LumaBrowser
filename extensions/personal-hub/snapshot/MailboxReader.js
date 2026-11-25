const HiddenTab = require('./HiddenTab');
const ProtonMailbox = require('./ProtonMailbox');
const GmailMailbox = require('./GmailMailbox');

class MailboxReader {
  static MAILBOXES = { proton: ProtonMailbox, gmail: GmailMailbox };
  static OPEN_TIMEOUT_MS = 15000;
  static SETTLE_MS = 1500;

  constructor({ browser, tabs, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
    this._browser = browser;
    this._tabs = tabs;
    this._sleep = sleep;
  }

  handles(item) {
    return !!(item && MailboxReader.MAILBOXES[item.app]);
  }

  async read(item, { tab = null, partition } = {}) {
    const mailbox = MailboxReader.MAILBOXES[item.app];
    const url = mailbox ? mailbox.searchAddress(item, tab) : null;
    if (!url) return null;
    const text = await HiddenTab.use(this._browser, { url, partition, ready: mailbox.LIST }, async (tabId) => {
      if (!await mailbox.open(this._page(tabId), item)) return '';
      await this._sleep(MailboxReader.SETTLE_MS);
      return this._tabs.run(tabId, mailbox.READ_JS);
    });
    return text ? { url, text: String(text) } : null;
  }

  async show(item, { tab = null, partition } = {}) {
    const mailbox = MailboxReader.MAILBOXES[item.app];
    const url = mailbox ? mailbox.searchAddress(item, tab) : null;
    if (!url) return false;
    const created = await this._browser.createTab(url, { kind: 'user', partition });
    const opened = created && created.success !== false ? (created.tab || created) : null;
    const tabId = opened ? (opened.id != null ? opened.id : opened.tabId) : null;
    if (tabId == null) return false;
    try {
      await this._browser.waitForLoad(tabId, HiddenTab.LOAD_TIMEOUT_MS);
      if (await this._page(tabId).waitFor(mailbox.LIST)) await mailbox.open(this._page(tabId), item);
    } catch (_) {}
    return true;
  }

  _page(tabId) {
    return {
      run: (code) => this._tabs.run(tabId, code),
      waitFor: async (selector) => {
        const found = await this._browser.waitFor(tabId, { selector, timeout: MailboxReader.OPEN_TIMEOUT_MS });
        return !!found && found.success !== false;
      },
    };
  }
}

module.exports = MailboxReader;
