const NotificationClassifier = require('../inbox/NotificationClassifier');

class ConversationLocator {
  static AUTOMATION_HOST = 'automation';
  static SLACK_TEAM = /\/client\/([A-Z0-9]+)/;
  static PANES = { slack: '.p-message_pane' };

  constructor({ tabs, slack = null }) {
    this._tabs = tabs;
    this._slack = slack;
  }

  async locate(item) {
    const tab = this.tabFor(item);
    const url = ConversationLocator.ownAddress(item, tab) || await this._slackAddress(item, tab);
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
    const path = (value) => { try { const u = new URL(String(value)); return `${u.host}${u.pathname}`.replace(/\/+$/, ''); } catch (_) { return ''; } };
    return !!tab && !!path(url) && path(tab.url) === path(url);
  }

  async _slackAddress(item, tab) {
    if (item.app !== 'slack' || !tab || !this._slack) return null;
    return this._slack.addressOf(tab, NotificationClassifier.slackConversation(item.title).name);
  }
}

module.exports = ConversationLocator;
