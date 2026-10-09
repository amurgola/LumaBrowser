const GoogleSessionCalendarProvider = require('../calendar/providers/GoogleSessionCalendarProvider');
const SapisidHash = require('../calendar/session/SapisidHash');

class GoogleAccounts {
  static MAX_ACCOUNTS = 5;
  static COOKIE_DOMAIN = 'google.com';
  static LIST_URL = `${GoogleSessionCalendarProvider.API}/users/me/calendarList`;

  constructor({ tabs, fetchImpl = null, now = () => Date.now() } = {}) {
    this._tabs = tabs;
    this._fetch = fetchImpl;
    this._now = now;
  }

  async probe(partition) {
    const cookies = await this._tabs.cookies(partition, GoogleAccounts.COOKIE_DOMAIN);
    const sapisid = SapisidHash.sapisidOf(cookies);
    if (!sapisid) return { status: 'signed_out', accounts: [] };
    const accounts = [];
    try {
      for (let authUser = 0; authUser < GoogleAccounts.MAX_ACCOUNTS; authUser += 1) {
        const account = await this._account(cookies, sapisid, authUser);
        if (!account) break;
        accounts.push(account);
      }
    } catch (err) {
      return { status: 'error', accounts, error: (err && err.message) || String(err) };
    }
    return { status: accounts.length ? 'ok' : 'signed_out', accounts };
  }

  async _account(cookies, sapisid, authUser) {
    const url = new URL(GoogleAccounts.LIST_URL);
    url.searchParams.set('key', GoogleSessionCalendarProvider.EMBED_API_KEY);
    url.searchParams.set('maxResults', '250');
    const doFetch = this._fetch || globalThis.fetch;
    const response = await doFetch(url.href, {
      headers: {
        Authorization: SapisidHash.header(sapisid, GoogleSessionCalendarProvider.ORIGIN, this._now()),
        Cookie: SapisidHash.cookieHeader(cookies, GoogleSessionCalendarProvider.API_HOST),
        Origin: GoogleSessionCalendarProvider.ORIGIN,
        Referer: `${GoogleSessionCalendarProvider.ORIGIN}/`,
        Accept: 'application/json',
        'X-Goog-AuthUser': String(authUser),
      },
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`Google Calendar: HTTP ${response.status}`);
    const body = await response.json();
    const calendars = (Array.isArray(body.items) ? body.items : []).map(GoogleAccounts._calendar);
    const primary = calendars.find((c) => c.primary);
    return { authUser, email: primary ? primary.id : '', calendars };
  }

  static _calendar(item) {
    return {
      id: String(item.id || ''),
      name: item.summaryOverride || item.summary || item.id || '',
      color: item.backgroundColor || '',
      primary: !!item.primary,
      accessRole: item.accessRole || '',
    };
  }
}

module.exports = GoogleAccounts;
