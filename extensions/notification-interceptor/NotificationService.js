const { EventEmitter } = require('events');
const RecordId = require('../../core/database/RecordId');
const NotificationLogStore = require('./NotificationLogStore');
const NotificationForwarder = require('./NotificationForwarder');

class NotificationService extends EventEmitter {
  static WEBHOOK_KEY = 'webhookUrl';
  static NO_WEBHOOK_ERROR = 'No webhook URL configured';
  static INGESTED_EVENT = 'ingested';

  constructor({ db, logStore = null, forwarder = null, now = () => new Date() }) {
    super();
    this._db = db;
    this._logStore = logStore || new NotificationLogStore(db);
    this._forwarder = forwarder || new NotificationForwarder();
    this._now = now;
  }

  getWebhookUrl() {
    return this._db.get(NotificationService.WEBHOOK_KEY, '');
  }

  setWebhookUrl(url) {
    this._db.set(NotificationService.WEBHOOK_KEY, url);
  }

  async ingest(notification) {
    const webhookUrl = this.getWebhookUrl();
    const entry = this._newEntry(notification, webhookUrl);
    if (webhookUrl) await this._forwardInto(entry, webhookUrl, notification);
    this._logStore.record(entry);
    this._announce(notification, entry);
    return { success: entry.forward !== 'failed', entry, count: this._logStore.count() };
  }

  onIngest(cb) {
    if (typeof cb !== 'function') return () => {};
    this.on(NotificationService.INGESTED_EVENT, cb);
    return () => this.off(NotificationService.INGESTED_EVENT, cb);
  }

  async forward(notification) {
    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) return { success: false, error: NotificationService.NO_WEBHOOK_ERROR };
    try {
      return { success: true, response: await this._forwarder.forward(webhookUrl, notification) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getLog() {
    return { entries: this._logStore.entries(), count: this._logStore.count() };
  }

  clearLog() {
    this._logStore.clear();
  }

  entries() {
    return this._logStore.entries();
  }

  count() {
    return this._logStore.count();
  }

  _newEntry(notification, webhookUrl) {
    return {
      id: RecordId.create('ntf'),
      at: this._now().toISOString(),
      source: notification.source || '',
      title: notification.title || '',
      body: notification.body || '',
      url: notification.url || '',
      tabTitle: notification.tabTitle || '',
      forward: webhookUrl ? 'sent' : 'skipped',
      error: null,
    };
  }

  _announce(notification, entry) {
    try { this.emit(NotificationService.INGESTED_EVENT, { notification, entry }); } catch (_) {}
  }

  async _forwardInto(entry, webhookUrl, notification) {
    try {
      await this._forwarder.forward(webhookUrl, notification);
    } catch (error) {
      entry.forward = 'failed';
      entry.error = error.message;
      console.error('notification-interceptor: forwarding error:', error.message);
    }
  }
}

module.exports = NotificationService;
