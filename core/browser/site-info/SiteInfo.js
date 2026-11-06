const SitePermissionStore = require('../SitePermissionStore');
const PermissionKinds = require('../PermissionKinds');

class SiteInfo {
  static KINDS = ['camera', 'microphone', 'notifications', 'popups'];
  static VALUES = ['ask', 'allow', 'block'];

  constructor({ db, getTabViewManager, adblocker = null }) {
    this._sites = new SitePermissionStore(db);
    this._tvm = getTabViewManager || (() => null);
    this._adblocker = adblocker;
  }

  async get(tabId) {
    const tab = this._tab(tabId);
    if (!tab) return { success: false, error: 'Not a web page' };
    const permissions = {};
    for (const kind of SiteInfo.KINDS) permissions[kind] = this._sites.answerFor(tab.origin, kind) || 'ask';
    return {
      success: true,
      origin: tab.origin,
      host: tab.host,
      secure: tab.origin.startsWith('https:'),
      private: !!tab.entry.isPrivate && tab.entry.isPrivate(),
      permissions,
      adblock: this._adblockState(tab.host),
      cookies: await this._cookieCount(tab),
    };
  }

  setPermission(tabId, kind, value) {
    const tab = this._tab(tabId);
    if (!tab || !SiteInfo.KINDS.includes(kind) || !SiteInfo.VALUES.includes(value)) return { success: false };
    if (value === 'ask') this._sites.forget(tab.origin, kind);
    else this._sites.remember(tab.origin, [kind], value);
    return { success: true, value };
  }

  setAdblock(tabId, off) {
    const tab = this._tab(tabId);
    if (!tab || !this._adblocker || typeof this._adblocker.setSiteAllowed !== 'function') return { success: false };
    const res = this._adblocker.setSiteAllowed(tab.host, !!off);
    SiteInfo._reload(tab.entry);
    return res;
  }

  async clearData(tabId) {
    const tab = this._tab(tabId);
    if (!tab) return { success: false };
    const sess = tab.entry.webContents.session;
    let removed = 0;
    try {
      for (const c of await this._siteCookies(tab)) {
        const scheme = c.secure ? 'https' : 'http';
        const url = `${scheme}://${String(c.domain || tab.host).replace(/^\./, '')}${c.path || '/'}`;
        await sess.cookies.remove(url, c.name);
        removed++;
      }
      await sess.clearStorageData({ origin: tab.origin, storages: ['localstorage', 'indexdb', 'websql', 'serviceworkers', 'cachestorage', 'filesystem'] });
    } catch (err) {
      return { success: false, error: err.message };
    }
    SiteInfo._reload(tab.entry);
    return { success: true, removed };
  }

  _adblockState(host) {
    if (!this._adblocker) return { available: false, on: false };
    const enabled = typeof this._adblocker.isEnabled === 'function' && this._adblocker.isEnabled();
    const offHere = typeof this._adblocker.isAllowedSite === 'function' && this._adblocker.isAllowedSite(host);
    return { available: enabled, on: enabled && !offHere };
  }

  async _cookieCount(tab) {
    try { return (await this._siteCookies(tab)).length; } catch (_) { return 0; }
  }

  async _siteCookies(tab) {
    const all = await tab.entry.webContents.session.cookies.get({});
    return all.filter((c) => {
      const d = String(c.domain || '').replace(/^\./, '').toLowerCase();
      return d && (tab.host === d || tab.host.endsWith(`.${d}`));
    });
  }

  _tab(tabId) {
    const tvm = this._tvm();
    const entry = tvm ? tvm.getEntry(Number(tabId)) : null;
    if (!entry || !entry.isRegularBrowsing()) return null;
    let url = entry.url;
    try { url = entry.webContents.getURL() || url; } catch (_) {}
    const origin = PermissionKinds.originOf(url);
    if (!origin || !/^https?:/.test(origin)) return null;
    return { entry, origin, host: new URL(origin).hostname.toLowerCase() };
  }

  static _reload(entry) {
    try { entry.webContents.reload(); } catch (_) {}
  }
}

module.exports = SiteInfo;
