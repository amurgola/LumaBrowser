const crypto = require('crypto');
const TriggerSource = require('./TriggerSource');

class NotificationSource extends TriggerSource {
  static KIND = 'notification';
  static EVENT = 'notification';
  static MAX_TEXT = 4000;
  static MAX_SHORT_TEXT = 500;
  static MAX_TAG = 200;
  static PERSISTED_TABS_KEY = 'core.browser.persistedTabs';

  constructor({ triggerStore, runner, getTabViewManager, settingsDb = null } = {}) {
    super({ triggerStore, runner, getUpstream: getTabViewManager });
    this.settingsDb = settingsDb;
  }

  static matches(source, event) {
    const s = source || {};
    if (!s.host && !s.tabPartition) return false;
    if (s.tabPartition && (!event.tab || event.tab.partition !== s.tabPartition)) return false;
    if (s.host && !NotificationSource._hostMatches(s.host, event.host)) return false;
    return true;
  }

  static eventFor(payload = {}, tab = null) {
    const n = payload && typeof payload === 'object' ? payload : {};
    const url = n.url || (tab && tab.url) || null;
    return {
      receivedAt: new Date().toISOString(),
      event: NotificationSource.EVENT,
      title: NotificationSource._clip(n.title, NotificationSource.MAX_SHORT_TEXT),
      body: NotificationSource._clip(n.body, NotificationSource.MAX_TEXT),
      tag: n.tag ? NotificationSource._clip(n.tag, NotificationSource.MAX_TAG) : null,
      data: NotificationSource._boundedData(n.data),
      icon: n.icon ? NotificationSource._clip(n.icon, NotificationSource.MAX_SHORT_TEXT) : null,
      url,
      host: NotificationSource._hostOf(url) || String(n.source || '').toLowerCase() || null,
      tab: NotificationSource._tabFacts(tab),
    };
  }

  static syntheticEvent(body) {
    const n = NotificationSource._sampleToNotification(body);
    const tab = n.tab && typeof n.tab === 'object' ? { ...n.tab, keepAlive: !!n.tab.persisted } : null;
    return { ...NotificationSource.eventFor(n, tab), synthetic: true };
  }

  static dedupeKeyFor(event) {
    const scope = (event.tab && event.tab.partition) || event.host || '';
    if (event.tag) return `notif:${scope}:${event.tag}`;
    const minute = String(event.receivedAt || '').slice(0, 16);
    const hash = crypto.createHash('sha1').update(`${event.title}\n${event.body}\n${minute}`).digest('hex').slice(0, 16);
    return `notif:${scope}:${hash}`;
  }

  listTabs() {
    const seen = new Set();
    return [...this._liveTabs(), ...this._storedTabs()].filter((tab) => {
      if (seen.has(tab.partition)) return false;
      seen.add(tab.partition);
      return true;
    });
  }

  getTab(partition) {
    return this.listTabs().find((tab) => tab.partition === String(partition)) || null;
  }

  onNotification(payload = {}) {
    const event = NotificationSource.eventFor(payload.notificationData || payload, payload.tab || null);
    return this._deliverToMatching(event, NotificationSource.dedupeKeyFor(event));
  }

  _canSubscribe(tabViewManager) {
    return typeof tabViewManager.on === 'function';
  }

  _subscribe(tabViewManager, listener) {
    tabViewManager.on(NotificationSource.EVENT, listener);
    return () => tabViewManager.off(NotificationSource.EVENT, listener);
  }

  _handle(payload) {
    this.onNotification(payload);
  }

  _matchesTrigger(trigger, event) {
    return NotificationSource.matches(trigger.source, event);
  }

  _liveTabs() {
    const tvm = this.upstream();
    if (!tvm || !tvm.tabs || typeof tvm.tabs.values !== 'function') return [];
    return Array.from(tvm.tabs.values())
      .filter((t) => t && t.keepAlive && t.partition)
      .map((t) => ({
        partition: t.partition, title: t.title || '', url: t.url || '', host: NotificationSource._hostOf(t.url),
        tabId: t.id, hidden: !!t.hidden, live: true,
      }));
  }

  _storedTabs() {
    return this._readPersistedTabList()
      .filter((e) => e && e.partition)
      .map((e) => ({
        partition: e.partition, title: e.title || '', url: e.url || '', host: NotificationSource._hostOf(e.url),
        tabId: null, hidden: true, live: false,
      }));
  }

  _readPersistedTabList() {
    try {
      const db = this.settingsDb;
      const raw = db && typeof db.get === 'function' ? db.get(NotificationSource.PERSISTED_TABS_KEY, null) : null;
      const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  static _sampleToNotification(body) {
    if (typeof body === 'string') return NotificationSource._parseSampleText(body.trim());
    if (body && typeof body === 'object') return body;
    return { body: String(body == null ? '' : body) };
  }

  static _parseSampleText(text) {
    if (!text.startsWith('{')) return { body: text };
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === 'object' ? parsed : { body: String(parsed) };
    } catch (_) {
      return { body: text };
    }
  }

  static _tabFacts(tab) {
    if (!tab) return null;
    return { id: tab.id != null ? tab.id : null, partition: tab.partition || null, title: tab.title || null, persisted: !!tab.keepAlive };
  }

  static _boundedData(data) {
    if (data == null) return null;
    if (typeof data !== 'object') return data;
    try {
      return JSON.stringify(data).length > NotificationSource.MAX_TEXT ? { truncated: true } : data;
    } catch (_) {
      return null;
    }
  }

  static _hostOf(url) {
    try { return new URL(String(url)).hostname.toLowerCase(); } catch (_) { return ''; }
  }

  static _hostMatches(want, actual) {
    const w = String(want || '').trim().toLowerCase().replace(/^www\./, '');
    const a = String(actual || '').trim().toLowerCase().replace(/^www\./, '');
    if (!w || !a) return false;
    return a === w || a.endsWith(`.${w}`);
  }

  static _clip(value, max) {
    const s = value == null ? '' : String(value);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }
}

module.exports = NotificationSource;
