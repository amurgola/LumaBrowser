const axios = require('axios');

class WatcherWebhook {
  static TIMEOUT_MS = 10000;
  static USER_AGENT = 'NotificationWebhookBrowser/1.0';

  static async post(url, payload) {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json', 'User-Agent': WatcherWebhook.USER_AGENT },
      timeout: WatcherWebhook.TIMEOUT_MS,
    });
    return { success: true, forwarded: true, status: response.status, statusText: response.statusText };
  }

  static notForwarded() {
    return { success: true, forwarded: false, message: 'Response captured but not forwarded (no webhook configured)' };
  }

  static failed(error) {
    return { success: false, forwarded: false, error: error.message };
  }
}

module.exports = WatcherWebhook;
