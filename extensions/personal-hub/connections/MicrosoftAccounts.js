const SignInPages = require('./SignInPages');

class MicrosoftAccounts {
  static HOSTS = [
    'teams.microsoft.com', 'teams.cloud.microsoft', 'teams.live.com',
    'outlook.office.com', 'outlook.office365.com', 'outlook.cloud.microsoft', 'outlook.live.com',
  ];
  static API = 'https://graph.microsoft.com/v1.0';
  static WAKE_WAIT_MS = 15000;
  static RELOAD_SETTLE_MS = 20000;
  static MIN_LIFETIME_S = 120;
  static NO_TAB = 'No persisted Teams or Outlook tab holds this Microsoft account. Open one and sign in.';
  static STALE = 'Teams/Outlook did not renew its sign-in after a wake-up and a reload. Open the tab to check it.';
  static SIGNED_OUT = 'Signed out of Microsoft 365. Sign in again in the tab.';

  static READ_TOKEN_JS = `(() => {
  var now = Date.now() / 1000, best = null;
  [window.localStorage, window.sessionStorage].forEach(function (store) {
    if (!store) return;
    for (var i = 0; i < store.length; i++) {
      var j;
      try { j = JSON.parse(store.getItem(store.key(i))); } catch (_) { continue; }
      if (!j || j.credentialType !== 'AccessToken' || !j.secret) continue;
      var target = String(j.target || '');
      if (target.indexOf('Calendars.Read') === -1) continue;
      if (target.indexOf('https://') !== -1 && target.indexOf('graph.microsoft.com/') === -1) continue;
      var exp = Number(j.expiresOn) || 0;
      if (exp - now < ${MicrosoftAccounts.MIN_LIFETIME_S}) continue;
      if (!best || exp > best.expiresOn) best = { secret: j.secret, expiresOn: exp };
    }
  });
  return best;
})()`;

  static isMicrosoftHost(host) {
    const h = String(host || '').toLowerCase();
    return MicrosoftAccounts.HOSTS.some((suffix) => h === suffix || h.endsWith(`.${suffix}`));
  }

  constructor({ tabs, fetchImpl = null, sleep = null } = {}) {
    this._tabs = tabs;
    this._fetch = fetchImpl;
    this._sleep = sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this._inFlight = new Map();
  }

  token(partition, { reload = true } = {}) {
    if (this._inFlight.has(partition)) return this._inFlight.get(partition);
    const pending = this._token(partition, reload).finally(() => this._inFlight.delete(partition));
    this._inFlight.set(partition, pending);
    return pending;
  }

  async probe(partition, { reload = true } = {}) {
    let token;
    try {
      token = await this.token(partition, { reload });
    } catch (err) {
      return { status: err.reason === 'signed_out' ? 'signed_out' : 'error', account: null, error: err.message, reason: err.reason };
    }
    try {
      const me = await this._get('/me?$select=mail,userPrincipalName', token);
      const calendars = await this._get('/me/calendars?$select=id,name,isDefaultCalendar,hexColor', token);
      return {
        status: 'ok',
        account: {
          email: me.mail || me.userPrincipalName || '',
          calendars: (calendars.value || []).map((c) => ({ id: c.id, name: c.name || c.id, primary: !!c.isDefaultCalendar, color: c.hexColor || '' })),
        },
      };
    } catch (err) {
      return { status: err.status === 401 ? 'signed_out' : 'error', account: null, error: err.status === 401 ? MicrosoftAccounts.SIGNED_OUT : err.message };
    }
  }

  tabFor(partition) {
    return this._tabs.persisted().find((t) => t.partition === partition && MicrosoftAccounts.isMicrosoftHost(t.host)) || null;
  }

  async _token(partition, reload) {
    const tab = this.tabFor(partition);
    if (!tab) throw MicrosoftAccounts._error(MicrosoftAccounts.NO_TAB, 'no_tab');
    if (SignInPages.isSignIn(tab.url)) throw MicrosoftAccounts._error(MicrosoftAccounts.SIGNED_OUT, 'signed_out');
    let found = await this._read(tab.tabId);
    if (found) return found;
    await this._tabs.wake(tab.tabId);
    await this._sleep(MicrosoftAccounts.WAKE_WAIT_MS);
    found = await this._read(tab.tabId);
    if (found) return found;
    if (reload && (!tab.active || tab.hidden)) {
      await this._tabs.reload(tab.tabId);
      await this._sleep(MicrosoftAccounts.RELOAD_SETTLE_MS);
      found = await this._read(tab.tabId);
      if (found) return found;
    }
    const after = this.tabFor(partition);
    if (after && SignInPages.isSignIn(after.url)) throw MicrosoftAccounts._error(MicrosoftAccounts.SIGNED_OUT, 'signed_out');
    throw MicrosoftAccounts._error(MicrosoftAccounts.STALE, 'stale');
  }

  async _read(tabId) {
    try {
      const found = await this._tabs.run(tabId, MicrosoftAccounts.READ_TOKEN_JS);
      return found && found.secret ? String(found.secret) : null;
    } catch (_) {
      return null;
    }
  }

  async _get(path, token) {
    const doFetch = this._fetch || globalThis.fetch;
    const response = await doFetch(`${MicrosoftAccounts.API}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (!response.ok) {
      const err = new Error(`Microsoft 365: HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return response.json();
  }

  static _error(message, reason) {
    const err = new Error(message);
    err.reason = reason;
    return err;
  }
}

module.exports = MicrosoftAccounts;
