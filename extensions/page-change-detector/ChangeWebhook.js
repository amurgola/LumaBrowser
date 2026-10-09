class ChangeWebhook {
  static TIMEOUT_MS = 10000;

  constructor({ post = null } = {}) {
    this._post = post;
  }

  async send(url, event) {
    try {
      await this._sender()(url, event, { headers: { 'Content-Type': 'application/json' }, timeout: ChangeWebhook.TIMEOUT_MS });
      console.log(`page-change-detector: webhook sent for "${event.monitorName}"`);
      return null;
    } catch (error) {
      console.error(`page-change-detector: webhook failed for "${event.monitorName}":`, error.message);
      return error.message;
    }
  }

  _sender() {
    return this._post || require('axios').post;
  }
}

module.exports = ChangeWebhook;
