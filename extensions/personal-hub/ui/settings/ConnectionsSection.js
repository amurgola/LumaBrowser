import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import HubSection from './HubSection.js';

export default class ConnectionsSection extends HubSection {
  static PROVIDERS = [{ value: 'google', label: 'Google' }, { value: 'microsoft', label: 'Microsoft 365' }];
  static SIGN_IN_NOTE = 'Sign in in the new tab. It stays open in the background, and its calendars appear here once you are signed in.';

  constructor(tab) {
    super(tab);
    this._connections = [];
    this._accounts = [];
    this._checkedAt = null;
  }

  html() {
    return `
    <h4 class="luma-section-label">Connections <span class="luma-badge muted" id="ext-hub-connCount">0</span></h4>
    <div class="luma-field-help">The Hub reads through the tabs you keep signed in: persist a tab (right-click it, Persist tab) and it shows up here. Tick a signed-in account's calendars to add them to the agenda. You get an alert when a tab signs out.</div>
    <div class="luma-list ext-mt-8" id="ext-hub-connList"></div>
    <div class="ext-layout-inline ext-layout-inline--space-between ext-mt-8">
      <div class="ext-layout-inline ext-layout-inline--gap-sm">
        <span class="luma-field-help" style="margin-top:0;">Add an account:</span>
        ${ConnectionsSection.PROVIDERS.map((p) => `<button class="luma-btn luma-btn--sm" data-signin="${p.value}">${p.label}</button>`).join('')}
      </div>
      <button class="luma-btn luma-btn--sm" id="ext-hub-connCheck">Check now</button>
    </div>`;
  }

  bind(container) {
    super.bind(container);
    this.$('connCheck').addEventListener('click', () => this.act(() => this.call('checkConnections'), 'Sign-ins checked.'));
    for (const btn of this.$$('[data-signin]')) btn.addEventListener('click', () => this._openSignIn(btn.dataset.signin));
    this.$('connList').addEventListener('click', (e) => this._onClick(e));
    this.$('connList').addEventListener('change', (e) => this._onTick(e));
  }

  async load() {
    if (!this._root) return;
    const { accounts } = await this.call('listAccountCalendars');
    const listed = await this.call('listConnections');
    this._accounts = accounts || [];
    this._connections = listed.connections || [];
    this._checkedAt = listed.checkedAt || null;
    this._render();
  }

  static dotClass(row) {
    if (row.needsAttention) return 'bad';
    if (row.status === 'ok') return 'ok';
    return 'warn';
  }

  static statusText(row) {
    if (row.status === 'ok') {
      const emails = (row.accounts || []).map((a) => a.email).filter(Boolean);
      return emails.length ? `Signed in as ${emails.join(', ')}` : 'Signed in';
    }
    if (row.status === 'signed_out') return `Signed out. ${row.detail || ''}`.trim();
    return row.detail || row.status;
  }

  _render() {
    const list = this.$('connList');
    const count = this.$('connCount');
    if (count) count.textContent = String(this._connections.length);
    if (!list) return;
    if (!this._connections.length) {
      list.innerHTML = `<div class="luma-empty luma-empty--plain">${this._checkedAt ? 'No persisted tabs of a known app yet. Use Add an account, or persist the tabs of the apps you use.' : 'Checking your tabs.'}</div>`;
      return;
    }
    list.innerHTML = this._connections.map((row) => this._row(row)).join('');
  }

  _row(row) {
    const esc = HtmlEscaper.escape;
    const badges = [`<span class="luma-badge muted">${esc(row.appLabel)}</span>`];
    if ((row.areas || []).includes('queue')) badges.push('<span class="luma-badge muted">Queue</span>');
    if (row.calendarsInUse) badges.push(`<span class="luma-badge muted">${row.calendarsInUse} calendar${row.calendarsInUse === 1 ? '' : 's'}</span>`);
    return `<div class="luma-dockpanel-row" data-key="${esc(row.key)}">
      <div class="luma-dockpanel-rowhead">
        <span class="luma-dot ${ConnectionsSection.dotClass(row)}"></span>
        <span class="luma-dockpanel-rowname">${esc(row.name || row.appLabel)}</span>
        ${badges.join('')}
        <span class="luma-dockpanel-rowactions">
          ${row.tabId != null ? '<button class="luma-btn luma-btn--sm" data-action="show">Open tab</button>' : ''}
        </span>
      </div>
      <div class="luma-dockpanel-rowmeta">${esc(ConnectionsSection.statusText(row))}</div>
      ${this._calendars(row)}
    </div>`;
  }

  _calendars(row) {
    const esc = HtmlEscaper.escape;
    const accounts = this._accounts.filter((a) => a.key === row.key && (a.calendars || []).length);
    if (!accounts.length) return '';
    return accounts.map((account) => `
      <div class="ext-mt-8">
        ${accounts.length > 1 ? `<div class="luma-field-label">${esc(account.email)}</div>` : ''}
        <div class="ext-checkbox-group">${account.calendars.map((c) => `
          <label class="luma-check"><input type="checkbox" data-calendar="${esc(JSON.stringify(ConnectionsSection._tickData(account, c)))}"${c.sourceId ? ' checked' : ''}>
            <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${esc(c.color || '#2563eb')}"></span>
            ${esc(c.name)}${c.primary ? ' <span class="luma-muted">(main)</span>' : ''}</label>`).join('')}
        </div>
      </div>`).join('');
  }

  static _tickData(account, calendar) {
    return {
      provider: account.provider, partition: account.partition, authUser: account.authUser, email: account.email,
      calendarId: calendar.id, name: calendar.primary && account.email ? account.email : calendar.name, color: calendar.color,
    };
  }

  _onClick(e) {
    const button = e.target.closest('button[data-action="show"]');
    const row = e.target.closest('[data-key]');
    if (!button || !row) return undefined;
    return this.act(() => this.call('showConnectionTab', row.dataset.key));
  }

  _onTick(e) {
    const box = e.target.closest('input[data-calendar]');
    if (!box) return undefined;
    let input;
    try { input = JSON.parse(box.dataset.calendar); } catch (_) { return undefined; }
    const enabled = box.checked;
    return this.act(() => this.call('setAccountCalendar', { ...input, enabled }), enabled ? `${input.name} added; it syncs in a moment.` : `${input.name} removed.`);
  }

  _openSignIn(provider) {
    return this.act(() => this.call('openSignInTab', provider), ConnectionsSection.SIGN_IN_NOTE);
  }
}
