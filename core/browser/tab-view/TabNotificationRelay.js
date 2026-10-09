class TabNotificationRelay {
  constructor({ registry, channel, emitter }) {
    this._registry = registry;
    this._channel = channel;
    this._emitter = emitter;
  }

  relay(senderWebContents, notificationData) {
    const tabId = this._registry.findIdByWebContents(senderWebContents);
    if (tabId === null) return;
    this._channel.send('notification-intercepted', { tabId, notificationData });
    this._emitToListeners(tabId, notificationData);
  }

  _emitToListeners(tabId, notificationData) {
    try {
      this._emitter.emit('notification', { tabId, notificationData, tab: TabNotificationRelay._tabSummary(this._registry.get(tabId)) });
    } catch (_) {}
  }

  static _tabSummary(entry) {
    if (!entry) return null;
    return {
      id: entry.id,
      partition: entry.partition || null,
      title: entry.title || '',
      url: entry.url || '',
      keepAlive: !!entry.keepAlive,
      hidden: !!entry.hidden,
    };
  }
}

module.exports = TabNotificationRelay;
