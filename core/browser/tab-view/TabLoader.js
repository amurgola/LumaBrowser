const TabUrl = require('../TabUrl');
const TabRegistry = require('./TabRegistry');

class TabLoader {
  static LOAD_TIMEOUT_MS = 15000;

  constructor({ registry, channel }) {
    this._registry = registry;
    this._channel = channel;
  }

  async navigate(tabId, url) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    const normalized = TabUrl.normalize(url);
    const load = await TabLoader._loadAndReport(entry, normalized);
    return { success: true, data: { navigatedTo: normalized, ...load } };
  }

  async waitForLoad(tabId, timeoutMs = TabLoader.LOAD_TIMEOUT_MS) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    const wc = entry.webContents;
    if (!wc.isLoading()) return { success: true, loaded: true };
    await TabLoader._untilStopped(wc, timeoutMs);
    return { success: true, loaded: !wc.isLoading() };
  }

  reload(tabId, { ignoreCache = false } = {}) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    if (entry._errorPageFor) TabLoader._retryFailedUrl(entry);
    else TabLoader._reloadPage(entry.webContents, ignoreCache);
    return { success: true, data: { refreshed: true } };
  }

  stop(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    try { entry.webContents.stop(); } catch (_) {}
    entry.loading = false;
    this._channel.broadcast(entry);
    return { success: true };
  }

  static async _loadAndReport(entry, normalized, timeoutMs = TabLoader.LOAD_TIMEOUT_MS) {
    const wc = entry.webContents;
    const report = { loaded: true };
    await TabLoader._boundedLoad(wc, normalized, timeoutMs, report);
    report.finalUrl = wc.getURL();
    report.title = wc.getTitle();
    if (entry.lastHttpStatus) report.httpStatus = entry.lastHttpStatus;
    if (report.finalUrl && report.finalUrl !== normalized) report.redirected = true;
    return report;
  }

  static async _boundedLoad(wc, url, timeoutMs, report) {
    let timer = null;
    try {
      const timedOut = await Promise.race([
        wc.loadURL(url).then(() => false),
        new Promise((resolve) => { timer = setTimeout(() => resolve(true), timeoutMs); }),
      ]);
      if (timedOut) {
        report.loaded = false;
        report.loadState = `still loading after ${timeoutMs}ms`;
      }
    } catch (err) {
      if (!/ERR_ABORTED/i.test(err.message || '')) {
        report.loaded = false;
        report.loadError = err.message;
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  static _untilStopped(wc, timeoutMs) {
    return new Promise((resolve) => {
      let timer = null;
      const done = () => {
        if (timer) clearTimeout(timer);
        wc.removeListener('did-stop-loading', done);
        resolve();
      };
      timer = setTimeout(done, timeoutMs);
      wc.on('did-stop-loading', done);
    });
  }

  static _retryFailedUrl(entry) {
    const target = entry._errorPageFor;
    entry._errorPageFor = null;
    entry.webContents.loadURL(target).catch(() => {});
  }

  static _reloadPage(wc, ignoreCache) {
    if (ignoreCache && typeof wc.reloadIgnoringCache === 'function') wc.reloadIgnoringCache();
    else wc.reload();
  }
}

module.exports = TabLoader;
