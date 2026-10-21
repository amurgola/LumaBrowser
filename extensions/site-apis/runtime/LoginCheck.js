const Faults = require('../spec/Faults');
const RunFault = require('./RunFault');
const SignedOutNotice = require('./SignedOutNotice');

class LoginCheck {
  static SIGN_IN_PAGES = [
    ['accounts.google.com', null],
    ['login.microsoftonline.com', null],
    ['login.live.com', null],
    ['login.microsoft.com', null],
    ['slack.com', /^\/(signin|workspace-signin|check-login|get-started)/i],
    ['app.clickup.com', /^\/(login|signup)/i],
    ['messages.google.com', /^\/web\/authentication/i],
    ['account.proton.me', /^\/(login|mail|calendar)?\/?$/i],
    ['discord.com', /^\/login/i],
  ];

  static URL_SCRIPT = 'location.href';
  static STATUS_OK = 'ok';
  static STATUS_SIGNED_OUT = 'signed_out';

  constructor({ browser, onSiteStatus = () => {}, showSiteTab = () => {}, notice = new SignedOutNotice(), logger = console }) {
    this._browser = browser;
    this._onSiteStatus = onSiteStatus;
    this._showSiteTab = showSiteTab;
    this._notice = notice;
    this._logger = logger;
    this._reported = new Map();
  }

  async check(site, tabId) {
    const url = await this._url(tabId);
    const reason = (await this._signedOutReason(site, tabId, url));
    if (!reason) return url;
    this._signedOut(site, reason);
    throw RunFault.make(Faults.NEEDS_LOGIN, `${site.name || site.id} needs a sign-in: ${reason}`, { detail: { url } });
  }

  markOk(site) {
    const last = this._reported.get(site.id);
    if (site.status === LoginCheck.STATUS_OK && last !== LoginCheck.STATUS_SIGNED_OUT) return;
    if (last === LoginCheck.STATUS_OK) return;
    this._reported.set(site.id, LoginCheck.STATUS_OK);
    this._onSiteStatus(site.id, LoginCheck.STATUS_OK, null);
  }

  async _signedOutReason(site, tabId, url) {
    const login = site.login || {};
    if (url && LoginCheck.matchesPatterns(url, login.signInUrlPatterns)) return `the tab landed on a sign-in page (${url})`;
    if (url && LoginCheck.isKnownSignIn(url, site.origin)) return `the tab landed on a sign-in page (${url})`;
    const wanted = [login.signedOutSelector, login.signedInSelector].filter(Boolean);
    if (!wanted.length) return null;
    const found = await this._found(tabId, wanted);
    if (login.signedOutSelector && found.get(login.signedOutSelector)) return `the signed-out element "${login.signedOutSelector}" is on the page`;
    if (login.signedInSelector && found.get(login.signedInSelector) === false) return `the signed-in element "${login.signedInSelector}" is missing`;
    return null;
  }

  static matchesPatterns(url, patterns) {
    for (const pattern of patterns || []) {
      const regex = LoginCheck._regexOf(pattern);
      if (regex ? regex.test(url) : url.includes(pattern)) return true;
    }
    return false;
  }

  static isKnownSignIn(url, siteOrigin = null) {
    let parsed;
    try { parsed = new URL(String(url || '')); } catch (_) { return false; }
    const host = parsed.hostname.toLowerCase();
    const own = LoginCheck._hostOf(siteOrigin);
    return LoginCheck.SIGN_IN_PAGES.some(([suffix, path]) =>
      LoginCheck._onHost(host, suffix) && !LoginCheck._onHost(own, suffix) && (!path || path.test(parsed.pathname)));
  }

  _signedOut(site, reason) {
    if (this._reported.get(site.id) === LoginCheck.STATUS_SIGNED_OUT) return;
    this._reported.set(site.id, LoginCheck.STATUS_SIGNED_OUT);
    try { this._onSiteStatus(site.id, LoginCheck.STATUS_SIGNED_OUT, reason); } catch (err) { this._logger.warn(`site-apis: status update failed: ${err.message}`); }
    try {
      this._notice.show({
        title: `${site.name || site.id} needs a sign-in`,
        body: 'A Site API call found the site signed out. Click to open its tab and sign in.',
        onClick: () => this._showSiteTab(site.id),
      });
    } catch (err) {
      this._logger.warn(`site-apis: notification failed: ${err.message}`);
    }
  }

  async _url(tabId) {
    try {
      const res = await this._browser.executeJs(tabId, LoginCheck.URL_SCRIPT);
      const value = res && res.success && res.data ? res.data.result : null;
      return typeof value === 'string' ? value : null;
    } catch (_) {
      return null;
    }
  }

  async _found(tabId, selectors) {
    const map = new Map();
    try {
      const res = await this._browser.checkSelectors(tabId, selectors);
      for (const item of (res && res.success && res.results) || []) map.set(item.selector, !!item.found);
    } catch (_) {}
    return map;
  }

  static _regexOf(pattern) {
    const match = /^\/(.+)\/([a-z]*)$/.exec(String(pattern));
    if (!match) return null;
    try { return new RegExp(match[1], match[2]); } catch (_) { return null; }
  }

  static _hostOf(origin) {
    try { return origin ? new URL(origin).hostname.toLowerCase() : null; } catch (_) { return null; }
  }

  static _onHost(host, suffix) {
    return !!host && (host === suffix || host.endsWith(`.${suffix}`));
  }
}

module.exports = LoginCheck;
