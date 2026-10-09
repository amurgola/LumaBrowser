const NotificationClassifier = require('../inbox/NotificationClassifier');
const SignInPages = require('./SignInPages');
const MicrosoftAccounts = require('./MicrosoftAccounts');

class ConnectionMonitor {
  static CHECK_MS = 5 * 60 * 1000;
  static FIRST_CHECK_MS = 60 * 1000;
  static RECHECK_AFTER_SIGN_IN_MS = 10 * 1000;
  static CONFIRM_MS = 15 * 1000;
  static CHANGED_EVENT = 'connection.changed';
  static ALERT_EVENT = 'connection.alert';
  static SESSION_KINDS = ['google-session', 'microsoft-session'];
  static TOKEN_ERROR = /\b401\b|oauth|token/i;
  static APP_LABELS = {
    gmail: 'Gmail', 'google-calendar': 'Google Calendar', messages: 'Messages', slack: 'Slack', teams: 'Teams',
    outlook: 'Outlook', clickup: 'ClickUp', proton: 'Proton', discord: 'Discord', whatsapp: 'WhatsApp', telegram: 'Telegram',
  };

  constructor({ tabs, google, microsoft, listCalendarSources = () => [], listTaskSources = () => [], alert = null, emit = () => {}, now = () => new Date() }) {
    this._tabs = tabs;
    this._google = google;
    this._microsoft = microsoft;
    this._listCalendarSources = listCalendarSources;
    this._listTaskSources = listTaskSources;
    this._alert = alert;
    this._emit = emit;
    this._now = now;
    this._rows = [];
    this._attention = new Set();
    this._running = null;
    this._timer = null;
    this._first = null;
    this._recheck = null;
    this._confirm = new Map();
    this._unsubscribe = null;
    this._checkedAt = null;
  }

  static appFor(host) {
    const h = String(host || '').toLowerCase();
    if (h === 'calendar.google.com') return 'google-calendar';
    const app = NotificationClassifier.appFor(h);
    return ConnectionMonitor.APP_LABELS[app] ? app : null;
  }

  static isGoogleHost(host) {
    const h = String(host || '').toLowerCase();
    return h === 'google.com' || h.endsWith('.google.com');
  }

  start() {
    this.stop();
    this._timer = ConnectionMonitor._unref(setInterval(() => { this.check().catch(() => {}); }, ConnectionMonitor.CHECK_MS));
    this._first = ConnectionMonitor._unref(setTimeout(() => { this.check().catch(() => {}); }, ConnectionMonitor.FIRST_CHECK_MS));
    this._unsubscribe = this._tabs.onNavigated((nav) => this._onNavigated(nav));
  }

  stop() {
    clearInterval(this._timer);
    clearTimeout(this._first);
    clearTimeout(this._recheck);
    for (const timer of this._confirm.values()) clearTimeout(timer);
    this._confirm.clear();
    this._timer = null;
    this._first = null;
    this._recheck = null;
    if (this._unsubscribe) { try { this._unsubscribe(); } catch (_) {} }
    this._unsubscribe = null;
  }

  list() {
    return { checkedAt: this._checkedAt, connections: this._rows };
  }

  check() {
    if (!this._running) this._running = this._check().finally(() => { this._running = null; });
    return this._running;
  }

  show(key) {
    const row = this._rows.find((r) => r.key === key);
    if (!row || row.tabId == null) return { success: false, error: 'This connection has no tab to open.' };
    return this._tabs.show(row.tabId);
  }

  async _check() {
    const rows = await this._collect();
    this._checkedAt = this._now().toISOString();
    this._apply(rows);
    return this.list();
  }

  async _collect() {
    const calendars = this._safe(this._listCalendarSources);
    const tabs = this._tabs.persisted();
    const rows = [];
    const probed = new Set();
    for (const tab of tabs) {
      const app = ConnectionMonitor.appFor(tab.host);
      if (!app) continue;
      rows.push(await this._tabRow(tab, app, calendars, probed));
    }
    rows.push(...this._missingRows(calendars, tabs));
    rows.push(...this._trackerRows());
    return rows;
  }

  async _tabRow(tab, app, calendars, probed) {
    const row = {
      key: `tab:${tab.partition}|${tab.host}`, kind: 'tab', app, appLabel: ConnectionMonitor.APP_LABELS[app],
      title: tab.title, partition: tab.partition, tabId: tab.tabId, url: tab.url, hidden: tab.hidden,
      provider: null, accounts: [], status: 'ok', detail: '', areas: app === 'google-calendar' ? [] : ['queue'],
      calendarsInUse: calendars.filter((s) => s.config && s.config.partition === tab.partition).length,
    };
    if (row.calendarsInUse) row.areas.push('calendar');
    if (SignInPages.isSignIn(tab.url)) {
      if (tab.loading) return { ...row, status: this._previous(row.key, 'ok') };
      return { ...row, status: 'signed_out', detail: 'The tab is on its sign-in page.' };
    }
    const provider = ConnectionMonitor.isGoogleHost(tab.host) ? 'google' : (MicrosoftAccounts.isMicrosoftHost(tab.host) ? 'microsoft' : null);
    if (!provider || probed.has(`${provider}:${tab.partition}`)) {
      if (tab.loading) return { ...row, status: this._previous(row.key, 'ok') };
      return row;
    }
    probed.add(`${provider}:${tab.partition}`);
    return provider === 'google' ? this._withGoogle(row) : this._withMicrosoft(row);
  }

  async _withGoogle(row) {
    const probe = await this._google.probe(row.partition);
    const read = probe.accounts.map((a) => ({ email: a.email, authUser: a.authUser, calendars: a.calendars }));
    const accounts = read.length ? read : this._previousAccounts(row.key);
    if (probe.status === 'signed_out') return { ...row, provider: 'google', accounts, status: 'signed_out', detail: 'Google reports no signed-in account in this tab.' };
    if (probe.status === 'error') return { ...row, provider: 'google', accounts, status: 'error', detail: probe.error };
    return { ...row, provider: 'google', accounts };
  }

  async _withMicrosoft(row) {
    const probe = await this._microsoft.probe(row.partition, { reload: this._previous(row.key, 'ok') !== 'error' });
    if (probe.status === 'ok') return { ...row, provider: 'microsoft', accounts: [{ email: probe.account.email, calendars: probe.account.calendars }] };
    return { ...row, provider: 'microsoft', accounts: this._previousAccounts(row.key), status: probe.status, detail: probe.error || '' };
  }

  _missingRows(calendars, tabs) {
    const partitions = new Set(tabs.map((t) => t.partition));
    const byPartition = new Map();
    for (const s of calendars) {
      const partition = s.config && s.config.partition;
      if (!ConnectionMonitor.SESSION_KINDS.includes(s.kind) || !partition || partitions.has(partition)) continue;
      if (!byPartition.has(partition)) byPartition.set(partition, []);
      byPartition.get(partition).push(s);
    }
    return [...byPartition].map(([partition, sources]) => ({
      key: `missing:${partition}`, kind: 'missing', app: sources[0].kind === 'microsoft-session' ? 'teams' : 'google-calendar',
      appLabel: sources[0].kind === 'microsoft-session' ? 'Microsoft 365' : 'Google',
      title: (sources[0].config && sources[0].config.account) || sources[0].label, partition, tabId: null, url: '', hidden: false,
      provider: null, accounts: [], status: 'missing', areas: ['calendar'], calendarsInUse: sources.length,
      detail: 'No persisted tab keeps this sign-in alive any more. Open the account in a tab and persist it.',
    }));
  }

  _trackerRows() {
    return this._safe(this._listTaskSources)
      .filter((s) => s.enabled !== false && s.lastStatus === 'error' && ConnectionMonitor.TOKEN_ERROR.test(s.lastError || ''))
      .map((s) => ({
        key: `tracker:${s.id}`, kind: 'tracker', app: 'clickup', appLabel: 'ClickUp', title: s.label, partition: '', tabId: null,
        url: '', hidden: false, provider: null, accounts: [], status: 'signed_out', areas: ['tasks'], calendarsInUse: 0,
        detail: 'ClickUp refused the API token. Paste a new one under Task trackers.',
      }));
  }

  _apply(rows) {
    const before = JSON.stringify(this._rows.map(ConnectionMonitor._fingerprint));
    for (const row of rows) {
      row.needsAttention = ConnectionMonitor.needsAttention(row);
      row.name = ConnectionMonitor.describe(row);
    }
    const attention = new Set(rows.filter((r) => r.needsAttention).map((r) => r.key));
    for (const row of rows) {
      if (row.needsAttention && !this._attention.has(row.key)) this._raise(row);
    }
    this._attention = attention;
    this._rows = rows;
    if (JSON.stringify(rows.map(ConnectionMonitor._fingerprint)) !== before) this._emit(ConnectionMonitor.CHANGED_EVENT, { connections: rows });
  }

  static needsAttention(row) {
    return row.status === 'signed_out' || (row.status === 'error' && row.provider === 'microsoft');
  }

  _raise(row) {
    const name = ConnectionMonitor.describe(row);
    const title = row.status === 'signed_out' ? `${name} is signed out` : `${name} needs attention`;
    const body = row.tabId != null ? `${row.detail} Click to open the tab.` : row.detail;
    this._emit(ConnectionMonitor.ALERT_EVENT, { key: row.key, title, message: row.detail });
    if (this._alert) this._alert.show({ title: `Hub: ${title}`, body, onClick: row.tabId != null ? () => this._tabs.show(row.tabId) : null });
  }

  static describe(row) {
    const account = row.accounts && row.accounts[0] && row.accounts[0].email;
    const detail = account || ConnectionMonitor._shortTitle(row.title, row.appLabel);
    return detail ? `${row.appLabel} (${detail})` : row.appLabel;
  }

  _onNavigated({ tabId, url }) {
    const row = this._rows.find((r) => r.tabId === tabId);
    const signedOut = SignInPages.isSignIn(url);
    if (!row) {
      if (!signedOut && this._tabs.persisted().some((t) => t.tabId === tabId && ConnectionMonitor.appFor(t.host))) this._scheduleRecheck();
      return;
    }
    if (signedOut && row.status !== 'signed_out') {
      this._confirmSignedOut(tabId);
    } else if (!signedOut && row.status === 'signed_out') {
      this._scheduleRecheck();
    }
  }

  _confirmSignedOut(tabId) {
    clearTimeout(this._confirm.get(tabId));
    this._confirm.set(tabId, ConnectionMonitor._unref(setTimeout(() => {
      this._confirm.delete(tabId);
      const tab = this._tabs.persisted().find((t) => t.tabId === tabId);
      const row = this._rows.find((r) => r.tabId === tabId);
      if (!tab || !row || row.status === 'signed_out' || !SignInPages.isSignIn(tab.url)) return;
      this._apply(this._rows.map((r) => (r === row ? { ...r, url: tab.url, status: 'signed_out', detail: 'The tab is on its sign-in page.' } : r)));
    }, ConnectionMonitor.CONFIRM_MS)));
  }

  _scheduleRecheck() {
    clearTimeout(this._recheck);
    this._recheck = ConnectionMonitor._unref(setTimeout(() => { this.check().catch(() => {}); }, ConnectionMonitor.RECHECK_AFTER_SIGN_IN_MS));
  }

  _previousAccounts(key) {
    const row = this._rows.find((r) => r.key === key);
    return row ? row.accounts || [] : [];
  }

  _previous(key, fallback) {
    const row = this._rows.find((r) => r.key === key);
    return row ? row.status : fallback;
  }

  _safe(fn) {
    try { return fn() || []; } catch (_) { return []; }
  }

  static _shortTitle(title, appLabel = '') {
    const text = String(title || '').replace(/^\(\d+\)\s*/, '').replace(/^[•●]\s*/, '');
    const email = /[\w.+-]+@[\w.-]+\.\w+/.exec(text);
    if (email) return email[0];
    const parts = text.split(/\s[|·-]\s/).map((p) => p.trim()).filter(Boolean);
    const app = String(appLabel).toLowerCase();
    const named = [...parts].reverse().find((p) => !app || !p.toLowerCase().includes(app));
    return (named || parts[0] || '').slice(0, 40);
  }

  static _fingerprint(row) {
    return [row.key, row.status, row.detail, (row.accounts || []).map((a) => `${a.email}:${(a.calendars || []).length}`).join(','), row.calendarsInUse];
  }

  static _unref(timer) {
    if (timer && typeof timer.unref === 'function') timer.unref();
    return timer;
  }
}

module.exports = ConnectionMonitor;
