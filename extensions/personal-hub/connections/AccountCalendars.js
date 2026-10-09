const GoogleSessionCalendarProvider = require('../calendar/providers/GoogleSessionCalendarProvider');

class AccountCalendars {
  static KIND = { google: 'google-session', microsoft: 'microsoft-session' };
  static DEFAULT_COLOR = '#2563eb';

  constructor({ monitor, calendar }) {
    this._monitor = monitor;
    this._calendar = calendar;
  }

  async list() {
    let { checkedAt, connections } = this._monitor.list();
    if (!checkedAt) ({ connections } = await this._monitor.check());
    const sources = this._calendar.listSources();
    const accounts = [];
    for (const row of connections) {
      if (!row.provider) continue;
      for (const account of row.accounts || []) {
        accounts.push({
          key: row.key, provider: row.provider, partition: row.partition, email: account.email, authUser: account.authUser != null ? account.authUser : null,
          appLabel: row.appLabel, title: row.title, status: row.status, detail: row.detail, tabId: row.tabId,
          calendars: (account.calendars || []).map((c) => ({ ...c, sourceId: AccountCalendars._sourceFor(sources, row, account, c.id) })),
        });
      }
    }
    return accounts;
  }

  async set({ provider, partition, authUser = null, email = '', calendarId, name = '', color = '', enabled } = {}) {
    const kind = AccountCalendars.KIND[provider];
    if (!kind) throw new Error(`Unknown account provider "${provider}"`);
    if (!partition || !calendarId) throw new Error('Pick a calendar of a signed-in account.');
    const existing = AccountCalendars._sourceFor(this._calendar.listSources(), { provider, partition }, { authUser }, calendarId);
    if (enabled && !existing) {
      this._calendar.addSource({ kind, label: String(name || calendarId), color: color || AccountCalendars.DEFAULT_COLOR, config: AccountCalendars._config(provider, { partition, authUser, email, calendarId, name }) });
    } else if (!enabled && existing) {
      this._calendar.removeSource(existing);
    }
    return this.list();
  }

  static _config(provider, { partition, authUser, email, calendarId, name }) {
    if (provider === 'google') {
      const config = { calendar: calendarId, calendarId, partition, account: email };
      if (authUser != null && Number(authUser) > 0) config.authUser = String(authUser);
      return config;
    }
    return { partition, account: email, calendarId, calendarName: name };
  }

  static _sourceFor(sources, row, account, calendarId) {
    const kind = AccountCalendars.KIND[row.provider];
    const authUser = String(account.authUser || 0);
    const hit = sources.find((s) => {
      if (s.kind !== kind || !s.config || s.config.partition !== row.partition) return false;
      if (kind === 'google-session') return GoogleSessionCalendarProvider.calendarIdOf(s.config) === calendarId && String(s.config.authUser || 0) === authUser;
      return s.config.calendarId === calendarId;
    });
    return hit ? hit.id : null;
  }
}

module.exports = AccountCalendars;
