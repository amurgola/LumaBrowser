const fs = require('fs');
const os = require('os');
const path = require('path');
const DataFileRender = require('../DataFileRender');

class DataFileDownloadHook {
  static SESSION_FLAG = '__lumaDataFileHook';

  constructor({ registry, downloads, closeTab }) {
    this._registry = registry;
    this._downloads = downloads;
    this._closeTab = closeTab;
  }

  install(sess) {
    if (!sess || sess[DataFileDownloadHook.SESSION_FLAG]) return;
    sess[DataFileDownloadHook.SESSION_FLAG] = true;
    sess.on('will-download', (_event, item, webContents) => this._onDownload(item, webContents));
  }

  _onDownload(item, webContents) {
    const info = DataFileDownloadHook._describe(item);
    if (!info) return;
    if (DataFileRender.isRenderableDataFile(info)) this._renderInline(item, webContents, info);
    else this._trackRegular(item, webContents);
  }

  static _describe(item) {
    try {
      return { mimeType: item.getMimeType(), filename: item.getFilename(), url: item.getURL() };
    } catch (_) {
      return null;
    }
  }

  _trackRegular(item, webContents) {
    try { this._downloads.track(item); } catch (_) {}
    this._closeBlankDownloadTab(webContents);
  }

  _closeBlankDownloadTab(webContents) {
    if (!webContents || webContents.isDestroyed()) return;
    const entry = this._registry.entries().find((tab) => tab.view && tab.view.webContents === webContents);
    if (!DataFileDownloadHook._isClosableDownloadTab(entry, webContents)) return;
    const visibleUserTabs = this._registry.entries().filter((tab) => tab.kind === 'user' && tab.isInStrip());
    if (visibleUserTabs.length <= 1) return;
    setTimeout(() => { try { this._closeTab(entry.id); } catch (_) {} }, 0);
  }

  static _isClosableDownloadTab(entry, webContents) {
    if (!entry || entry.pinned || entry.keepAlive || entry.silent || entry.kind !== 'user') return false;
    const committed = DataFileDownloadHook._committedCount(webContents);
    const url = DataFileDownloadHook._urlOf(webContents);
    return !(committed > 0 && url && url !== 'about:blank');
  }

  static _committedCount(webContents) {
    try {
      const nav = webContents.navigationHistory;
      return nav && typeof nav.length === 'function' ? nav.length() : 1;
    } catch (_) {
      return 1;
    }
  }

  static _urlOf(webContents) {
    try { return webContents.getURL(); } catch (_) { return ''; }
  }

  _renderInline(item, webContents, info) {
    const tmpPath = path.join(os.tmpdir(), `luma-datafile-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
    try {
      item.setSavePath(tmpPath);
    } catch (_) {
      return;
    }
    item.once('done', (_e, state) => this._onDiverted(state, tmpPath, webContents, info));
  }

  _onDiverted(state, tmpPath, webContents, info) {
    const text = DataFileDownloadHook._consumeTempFile(state, tmpPath, webContents);
    if (text === null) return;
    const html = DataFileRender.buildDataFileHtml(text, {
      filename: info.filename, sourceUrl: info.url, byteLength: Buffer.byteLength(text, 'utf8'),
    });
    this._loadRendered(webContents, html, info.url);
  }

  static _consumeTempFile(state, tmpPath, webContents) {
    const cleanup = () => fs.promises.unlink(tmpPath).catch(() => {});
    if (state !== 'completed' || !webContents || webContents.isDestroyed()) { cleanup(); return null; }
    try {
      return fs.readFileSync(tmpPath, 'utf8');
    } catch (err) {
      console.warn('[TabViewManager] data-file render read failed:', err.message);
      return null;
    } finally {
      cleanup();
    }
  }

  _loadRendered(webContents, html, sourceUrl) {
    const tabId = this._registry.findIdByWebContents(webContents);
    const entry = tabId === null ? null : this._registry.get(tabId);
    if (entry) entry._renderedSourceUrl = sourceUrl;
    const dataUrl = `data:text/html;charset=utf-8;base64,${Buffer.from(html, 'utf8').toString('base64')}`;
    webContents.loadURL(dataUrl).catch((err) => {
      if (entry) entry._renderedSourceUrl = null;
      console.warn('[TabViewManager] data-file inline render failed:', err.message);
    });
  }
}

module.exports = DataFileDownloadHook;
