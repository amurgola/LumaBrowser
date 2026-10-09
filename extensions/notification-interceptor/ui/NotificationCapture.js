export default class NotificationCapture {
  constructor(settingsTab) {
    this._tab = settingsTab;
    this._browserRenderer = null;
    this._prevHandler = undefined;
    this._installed = false;
  }

  install(browserRenderer) {
    this._browserRenderer = browserRenderer || null;
    this._prevHandler = window.handleNotification;
    window.handleNotification = (data, tabId) => this.receive(data, tabId);
    this._installed = true;
  }

  uninstall() {
    if (window.handleNotification && this._prevHandler !== undefined) {
      window.handleNotification = this._prevHandler;
    } else if (this._installed) {
      try { delete window.handleNotification; } catch (_) { window.handleNotification = undefined; }
    }
    this._prevHandler = undefined;
    this._installed = false;
  }

  async receive(notificationData, tabId) {
    const tabTitle = this._tabTitle(tabId);
    NotificationCapture._log(`${tabTitle}: ${notificationData.title}`, 'info');
    try {
      const result = await this._tab.invoke('ingest', { ...notificationData, tabId, tabTitle });
      this._tab.addIngested(result);
      this._updateShellStatus();
      NotificationCapture._logForward(tabTitle, result.entry);
    } catch (error) {
      NotificationCapture._log(`${tabTitle}: ${error.message}`, 'error');
    }
  }

  _tabTitle(tabId) {
    const renderer = this._browserRenderer;
    const tab = renderer && renderer.getTab ? renderer.getTab(tabId) : null;
    return tab ? (tab.title || `Tab ${tabId}`) : `Tab ${tabId}`;
  }

  _updateShellStatus() {
    const status = document.getElementById('notificationStatus');
    const text = document.getElementById('notificationStatusText');
    if (status) status.classList.add('active');
    if (text) text.textContent = `Notifications: ${this._tab.count} captured`;
  }

  static _logForward(tabTitle, entry) {
    if (!entry) return;
    if (entry.forward === 'sent') NotificationCapture._log(`${tabTitle}: forwarded to webhook`, 'success');
    else if (entry.forward === 'failed') NotificationCapture._log(`${tabTitle}: webhook error, ${entry.error}`, 'error');
  }

  static _log(message, level) {
    if (typeof window.addLogEntry === 'function') window.addLogEntry(message, level);
  }
}
