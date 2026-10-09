class WebhookTester {
  static TIMEOUT_MS = 5000;
  static MESSAGE = 'Test notification from LumaBrowser';
  static URL_ERROR = 'Enter an http(s) webhook URL.';

  constructor({ post = null, now = () => new Date() } = {}) {
    this._post = post;
    this._now = now;
  }

  async test(url) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return { success: false, error: WebhookTester.URL_ERROR };
    try {
      const response = await this._sender()(url, this._payload(), {
        headers: { 'Content-Type': 'application/json' },
        timeout: WebhookTester.TIMEOUT_MS,
      });
      return { success: true, status: response.status, response: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _payload() {
    return { timestamp: this._now().toISOString(), test: true, message: WebhookTester.MESSAGE };
  }

  _sender() {
    return this._post || require('axios').post;
  }
}

module.exports = WebhookTester;
