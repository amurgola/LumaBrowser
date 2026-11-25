const NotificationClassifier = require('../inbox/NotificationClassifier');

class ConversationLocator {
  static AUTOMATION_HOST = 'automation';
  static SLACK_TEAM = /\/client\/([A-Z0-9]+)/;
  static PANES = { slack: '.p-message_pane', teams: '[data-tid="message-pane-list-viewport"]', discord: '[data-list-id="chat-messages"]' };

  constructor({ tabs, lists = {} }) {
    this._tabs = tabs;
    this._lists = lists;
  }

  async locate(item) {
    const tab = this.tabFor(item);
    const url = ConversationLocator.ownAddress(item, tab) || await this._listedAddress(item, tab);
    return { tab, partition: ConversationLocator.partitionOf(item, tab), url, pane: ConversationLocator.PANES[item.app] || null };
  }

  tabFor(item) {
    let tabs = [];
    try { tabs = this._tabs.persisted(); } catch (_) { tabs = []; }
    const ofApp = tabs.filter((t) => NotificationClassifier.appFor(t.host) === item.app);
    const partition = (item.lastNotification || {}).partition;
    if (partition) return ofApp.find((t) => t.partition === partition) || tabs.find((t) => t.partition === partition) || null;
    return ofApp.length === 1 ? ofApp[0] : null;
  }

  static ownAddress(item, tab) {
    const last = item.lastNotification || {};
    const own = (item.context && item.context.conversationUrl) || '';
    if (/^https?:\/\//i.test(own)) return own;
    const url = item.url || last.url || '';
    const isLink = /^https?:\/\//i.test(url);
    if (isLink && (last.host === ConversationLocator.AUTOMATION_HOST || item.app === 'clickup')) return url;
    if (item.app === 'slack' && String(item.threadKey || '').startsWith('channel:')) {
      const team = String((tab && tab.url) || url).match(ConversationLocator.SLACK_TEAM);
      if (team) return `https://app.slack.com/client/${team[1]}/${item.threadKey.slice('channel:'.length)}`;
    }
    return null;
  }

  static partitionOf(item, tab) {
    return (item.lastNotification || {}).partition || (tab && tab.partition) || undefined;
  }

  static shows(tab, url) {
    const parts = (value) => { try { const u = new URL(String(value)); return { path: `${u.host}${u.pathname}`.replace(/\/+$/, ''), hash: u.hash }; } catch (_) { return { path: '', hash: '' }; } };
    const wanted = parts(url);
    const shown = parts(tab && tab.url);
    return !!tab && !!wanted.path && shown.path === wanted.path && (!wanted.hash || shown.hash === wanted.hash);
  }

  async _listedAddress(item, tab) {
    const list = this._lists[item.app];
    if (!list || !tab) return null;
    return list.addressOf(tab, item.app === 'slack' ? NotificationClassifier.slackConversation(item.title).name : item.title);
  }
}

module.exports = ConversationLocator;
