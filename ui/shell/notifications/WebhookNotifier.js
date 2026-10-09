export default class WebhookNotifier {
  constructor({ store, log }) {
    this._store = store;
    this._log = log;
    this.webhookUrl = '';
  }

  install() {
    if (window.electronAPI && window.electronAPI.onSettingsLoaded) {
      window.electronAPI.onSettingsLoaded((_event, settings) => this.updateStatus(settings.webhookUrl));
    }
  }

  async handle(notificationData, tabId) {
    const tabTitle = this._tabTitle(tabId);
    this._log.add(`${tabTitle}: ${notificationData.title}`, 'info');
    if (!this.webhookUrl) return;
    try {
      const result = await window.electronAPI.forwardNotification({ ...notificationData, tabId, tabTitle });
      if (result && result.success) this._log.add(`${tabTitle}: Forwarded to webhook`, 'success');
      else if (result) this._log.add(`${tabTitle}: Webhook error - ${result.error}`, 'error');
    } catch (error) {
      this._log.add(`${tabTitle}: Error - ${error.message}`, 'error');
    }
  }

  updateStatus(url) {
    const status = document.getElementById('webhookStatus');
    const text = document.getElementById('webhookStatusText');
    if (!status || !text) {
      if (url) this.webhookUrl = url;
      return;
    }
    if (url) {
      status.classList.add('active');
      text.textContent = `Webhook: ${new URL(url).hostname}`;
      this.webhookUrl = url;
    } else {
      status.classList.remove('active');
      text.textContent = 'Webhook: Not configured';
      this.webhookUrl = '';
    }
  }

  _tabTitle(tabId) {
    const tab = this._store.get(tabId);
    return tab ? (tab.title || `Tab ${tabId}`) : `Tab ${tabId}`;
  }
}
