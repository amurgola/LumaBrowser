export default class DefaultBrowserRow {
  constructor({ feedback }) {
    this._feedback = feedback;
  }

  install() {
    this._state = document.getElementById('gsDefaultBrowserState');
    this._btn = document.getElementById('gsDefaultBrowserBtn');
    if (!this._state || !this._btn || !window.ipcBridge) return false;
    this._btn.addEventListener('click', () => this._make());
    document.addEventListener('settings:open', () => this.refresh());
    window.addEventListener('focus', () => { if (this._waiting) this.refresh(); });
    return true;
  }

  static text(status) {
    if (!status || !status.supported) return 'This system does not let apps register as a browser.';
    return status.isDefault ? 'LumaBrowser opens web links from other apps.' : 'Another browser opens web links from other apps.';
  }

  async refresh() {
    let status = null;
    try { status = await window.ipcBridge.invoke('core.defaultBrowser.status'); } catch (_) { status = null; }
    this._state.textContent = DefaultBrowserRow.text(status);
    this._btn.hidden = !status || !status.supported || status.isDefault;
    if (status && status.isDefault) this._waiting = false;
  }

  async _make() {
    const res = await window.ipcBridge.invoke('core.defaultBrowser.makeDefault');
    if (!res || !res.success) { this._feedback.toast((res && res.error) || 'Could not register LumaBrowser', 'bad'); return; }
    this._waiting = true;
    if (res.opened === 'settings') this._feedback.toast('Pick LumaBrowser as the web browser in the Windows page that opened.', 'ok');
    await this.refresh();
  }
}
