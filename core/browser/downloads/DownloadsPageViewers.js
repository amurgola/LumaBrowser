const DownloadsPage = require('./DownloadsPage');

class DownloadsPageViewers {
  static EVENT_CHANNEL = 'core.downloads.event';

  constructor({ getTabViewManager }) {
    this._tvm = getTabViewManager || (() => null);
    this._pages = new Map();
    this._relayed = null;
  }

  downloads() {
    const tvm = this._tvm();
    return (tvm && tvm.downloads) || null;
  }

  openTab(windowId) {
    const tvm = this._tvm();
    if (!tvm) return { success: false, error: 'No browser window is open.' };
    const open = tvm.getWindowTabs(windowId).find((tab) => DownloadsPage.isDownloads(tab.url));
    if (open) return tvm.switchToTab(open.id);
    const tab = tvm.createTab(DownloadsPage.URL, { windowId, activate: true, title: DownloadsPage.TITLE });
    return { success: true, tab };
  }

  watch(sender) {
    const downloads = this.downloads();
    if (!downloads) return [];
    this._relayFrom(downloads);
    this._remember(sender);
    return downloads.list();
  }

  _relayFrom(downloads) {
    if (this._relayed === downloads) return;
    this._relayed = downloads;
    downloads.on('download', (download) => this._send({ type: 'download', download }));
    downloads.on('changed', () => this._send({ type: 'changed' }));
  }

  _remember(sender) {
    if (this._pages.has(sender.id)) return;
    this._pages.set(sender.id, sender);
    sender.once('destroyed', () => this._pages.delete(sender.id));
  }

  _send(event) {
    for (const [id, page] of this._pages) {
      if (DownloadsPageViewers._showsDownloads(page)) page.send(DownloadsPageViewers.EVENT_CHANNEL, event);
      else this._pages.delete(id);
    }
  }

  static _showsDownloads(page) {
    try { return !page.isDestroyed() && DownloadsPage.isDownloads(page.getURL()); } catch (_) { return false; }
  }
}

module.exports = DownloadsPageViewers;
