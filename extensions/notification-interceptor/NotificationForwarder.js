class NotificationForwarder {
  static TIMEOUT_MS = 10000;
  static FIELDS = ['source', 'title', 'body', 'icon', 'badge', 'tag', 'requireInteraction', 'silent', 'data', 'url',
    'tabId', 'tabTitle'];

  constructor({ post = null, now = () => new Date() } = {}) {
    this._post = post;
    this._now = now;
  }

  async forward(webhookUrl, notification) {
    const response = await this._sender()(webhookUrl, this.payloadFor(notification), {
      headers: { 'Content-Type': 'application/json' },
      timeout: NotificationForwarder.TIMEOUT_MS,
    });
    return response.data;
  }

  payloadFor(notification) {
    const payload = { timestamp: this._now().toISOString() };
    for (const field of NotificationForwarder.FIELDS) payload[field] = notification[field];
    return payload;
  }

  _sender() {
    return this._post || require('axios').post;
  }
}

module.exports = NotificationForwarder;
