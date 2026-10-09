import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import IntervalPicker from '../../../ui-kit/ui/IntervalPicker.js';
import HubSection from './HubSection.js';
import SourceStatus from './SourceStatus.js';

export default class CalendarSourcesSection extends HubSection {
  static KINDS = [
    { value: 'ics', label: 'ICS feed URL' },
    { value: 'google-session', label: 'Google Calendar (signed-in tab)' },
    { value: 'microsoft-session', label: 'Microsoft 365 (signed-in tab)', manual: false },
    { value: 'google', label: 'Google Calendar (OAuth app)' },
    { value: 'microsoft', label: 'Microsoft 365 (OAuth app)' },
  ];
  static NO_SIGN_IN_KINDS = ['ics', 'google-session', 'microsoft-session'];
  static DEFAULT_INTERVAL_MS = 900000;
  static DEFAULT_COLOR = '#2563eb';
  static ICS_HELP = 'Google: calendar settings > Secret address in iCal format (an embed or share link also works when the calendar is public). Outlook: Publish calendar > ICS link. Proton: Share > link.';
  static SESSION_HELP = 'Paste the embed link of the calendar (calendar.google.com/calendar/embed?src=...), share link or id. Events are read as the Google account signed in in your persisted Google tab; no OAuth app needed. If the calendar is public it works without a sign-in too.';

  constructor(tab) {
    super(tab);
    this._sources = [];
    this._interval = null;
    this._callbackUrl = '';
  }

  html() {
    const esc = HtmlEscaper.escape;
    return `
    <h4 class="luma-section-label">Calendars <span class="luma-badge muted" id="ext-hub-calCount">0</span></h4>
    <div class="luma-field-help">Every calendar here is synced into one agenda. Calendars of a signed-in Google or Microsoft tab are ticked under Connections; add the rest (a Proton share link, a published Outlook feed, an OAuth app) by hand.</div>
    <div class="luma-list ext-mt-8" id="ext-hub-calList"></div>
    <details class="ext-details ext-mt-12" id="ext-hub-calAdd">
      <summary>Add a calendar by hand</summary>
      <div class="ext-form-grid ext-mt-8">
        <div class="luma-field">
          <label class="luma-field-label">Kind</label>
          <select class="luma-field-select" id="ext-hub-calKind">${CalendarSourcesSection.KINDS.filter((k) => k.manual !== false).map((k) => `<option value="${k.value}">${esc(k.label)}</option>`).join('')}</select>
        </div>
        <div class="luma-field">
          <label class="luma-field-label">Label</label>
          <input type="text" class="luma-field-input" id="ext-hub-calLabel" placeholder="Work (Acme)">
        </div>
        <div class="luma-field">
          <label class="luma-field-label">Colour</label>
          <input type="color" class="luma-field-input" id="ext-hub-calColor" value="${CalendarSourcesSection.DEFAULT_COLOR}">
        </div>
        <div class="luma-field ext-form-grid-full" data-kind="ics">
          <label class="luma-field-label">ICS URL</label>
          <input type="text" class="luma-field-input" id="ext-hub-calUrl" placeholder="https://calendar.google.com/calendar/ical/.../basic.ics">
          <div class="luma-field-help">${esc(CalendarSourcesSection.ICS_HELP)}</div>
        </div>
        <div class="luma-field ext-form-grid-full" data-kind="google-session">
          <label class="luma-field-label">Calendar link or id</label>
          <input type="text" class="luma-field-input" id="ext-hub-calSessionCalendar" placeholder="https://calendar.google.com/calendar/embed?src=...%40group.calendar.google.com">
          <div class="luma-field-help">${esc(CalendarSourcesSection.SESSION_HELP)}</div>
        </div>
        <div class="luma-field" data-kind="google-session">
          <label class="luma-field-label">Google account number (optional)</label>
          <input type="text" class="luma-field-input" id="ext-hub-calAuthUser" placeholder="0">
          <div class="luma-field-help">When several Google accounts are signed in: 0 for the first, 1 for the second, as in calendar.google.com/calendar/u/1.</div>
        </div>
        <div class="luma-field" data-kind="google microsoft">
          <label class="luma-field-label">OAuth client id</label>
          <input type="text" class="luma-field-input" id="ext-hub-calClientId">
        </div>
        <div class="luma-field" data-kind="google microsoft">
          <label class="luma-field-label">OAuth client secret</label>
          <input type="password" class="luma-field-input" id="ext-hub-calClientSecret">
        </div>
        <div class="luma-field" data-kind="microsoft">
          <label class="luma-field-label">Tenant</label>
          <input type="text" class="luma-field-input" id="ext-hub-calTenant" value="common" placeholder="common">
        </div>
        <div class="luma-field" data-kind="google microsoft">
          <label class="luma-field-label">Calendar id (optional)</label>
          <input type="text" class="luma-field-input" id="ext-hub-calCalendarId" placeholder="primary">
        </div>
        <div class="luma-field ext-form-grid-full" data-kind="google microsoft">
          <div class="luma-field-help">Register this redirect URI on the OAuth client: <code class="luma-code-inline" id="ext-hub-calRedirect"></code></div>
        </div>
        <div class="luma-field">
          <label class="luma-field-label">Sync</label>
          ${IntervalPicker.markup('ext-hub-calInterval', CalendarSourcesSection.DEFAULT_INTERVAL_MS)}
        </div>
      </div>
      <div class="luma-form-actions ext-form-buttons--start ext-mt-8">
        <button class="luma-btn" id="ext-hub-calAddBtn">Add calendar</button>
      </div>
    </details>`;
  }

  bind(container) {
    super.bind(container);
    this._interval = IntervalPicker.bind(this.$('calInterval'));
    this.$('calKind').addEventListener('change', () => this._showKindFields());
    this.$('calAddBtn').addEventListener('click', () => this._add());
    this.$('calList').addEventListener('click', (e) => this._onRowAction(e));
    this._showKindFields();
  }

  setCallbackUrl(url) {
    this._callbackUrl = url || '';
    const el = this.$('calRedirect');
    if (el) el.textContent = this._callbackUrl;
  }

  async load() {
    if (!this._root) return;
    const { sources } = await this.call('listCalendarSources');
    this._sources = sources || [];
    this._renderList();
  }

  _showKindFields() {
    const kind = this.$('calKind').value;
    for (const el of this.$$('[data-kind]')) el.classList.toggle('ext-hidden', !el.dataset.kind.split(' ').includes(kind));
  }

  _renderList() {
    const list = this.$('calList');
    const count = this.$('calCount');
    if (count) count.textContent = String(this._sources.length);
    if (!list) return;
    if (!this._sources.length) {
      list.innerHTML = '<div class="luma-empty luma-empty--plain">No calendars yet.</div>';
      return;
    }
    list.innerHTML = this._sources.map((s) => CalendarSourcesSection._row(s)).join('');
  }

  static _row(s) {
    const esc = HtmlEscaper.escape;
    const kind = (CalendarSourcesSection.KINDS.find((k) => k.value === s.kind) || { label: s.kind }).label;
    const needsConnect = !CalendarSourcesSection.NO_SIGN_IN_KINDS.includes(s.kind) && !s.connected;
    return `<div class="luma-dockpanel-row" data-id="${esc(s.id)}">
      <div class="luma-dockpanel-rowhead">
        <span class="luma-dot ${SourceStatus.dotClass(s)}"></span>
        <span class="hub-swatch" style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${esc(s.color || CalendarSourcesSection.DEFAULT_COLOR)}"></span>
        <span class="luma-dockpanel-rowname">${esc(s.label)}</span>
        <span class="luma-badge muted">${esc(kind)}</span>
        ${s.config && s.config.account && s.config.account !== s.label ? `<span class="luma-badge muted">${esc(s.config.account)}</span>` : ''}
        ${s.eventCount != null ? `<span class="luma-badge muted">${esc(String(s.eventCount))} events</span>` : ''}
        <span class="luma-dockpanel-rowactions">
          ${needsConnect ? '<button class="luma-btn luma-btn--sm" data-action="connect">Connect</button>' : ''}
          <button class="luma-btn luma-btn--sm" data-action="sync">Sync now</button>
          <button class="luma-btn luma-btn--sm" data-action="remove">Remove</button>
        </span>
      </div>
      <div class="luma-dockpanel-rowmeta">${esc(needsConnect ? 'Not connected. Click Connect to sign in.' : SourceStatus.text(s))}</div>
    </div>`;
  }

  async _onRowAction(e) {
    const button = e.target.closest('button[data-action]');
    const row = e.target.closest('[data-id]');
    if (!button || !row) return;
    const id = row.dataset.id;
    const action = button.dataset.action;
    if (action === 'sync') return this.act(() => this.call('syncNow', { kind: 'calendar', sourceId: id }), 'Calendar synced.');
    if (action === 'connect') return this._connect(id);
    if (action === 'remove') {
      const ok = await Dialogs.confirm('Remove this calendar and its synced events?');
      if (ok) await this.act(() => this.call('removeCalendarSource', id), 'Calendar removed.');
    }
    return undefined;
  }

  async _connect(id) {
    try {
      await this.call('startOAuth', id);
      this._tab.notify('Finish signing in in the tab that opened; the calendar syncs once you are back here.', true);
    } catch (err) {
      this._tab.notify((err && err.message) || String(err), false);
    }
  }

  _readForm() {
    const kind = this.$('calKind').value;
    const base = {
      kind,
      label: this.$('calLabel').value.trim(),
      color: this.$('calColor').value || CalendarSourcesSection.DEFAULT_COLOR,
      intervalMs: this._interval.get(),
    };
    if (kind === 'ics') return { ...base, config: { url: this.$('calUrl').value.trim() } };
    if (kind === 'google-session') {
      const config = { calendar: this.$('calSessionCalendar').value.trim() };
      const authUser = this.$('calAuthUser').value.trim();
      if (authUser !== '') config.authUser = authUser;
      return { ...base, config };
    }
    const config = {
      clientId: this.$('calClientId').value.trim(),
      clientSecret: this.$('calClientSecret').value,
      calendarId: this.$('calCalendarId').value.trim(),
    };
    if (kind === 'microsoft') config.tenant = this.$('calTenant').value.trim() || 'common';
    return { ...base, config };
  }

  static _validate(input) {
    if (!input.label) return 'Give the calendar a label.';
    if (input.kind === 'ics' && !/^https?:\/\//i.test(input.config.url || '')) return 'Enter the ICS feed URL (https://...).';
    if (input.kind === 'google-session' && !input.config.calendar) return 'Paste the calendar link or id.';
    if (!CalendarSourcesSection.NO_SIGN_IN_KINDS.includes(input.kind) && !input.config.clientId) return 'Enter the OAuth client id.';
    return null;
  }

  async _add() {
    const input = this._readForm();
    const problem = CalendarSourcesSection._validate(input);
    if (problem) {
      this._tab.notify(problem, false);
      return;
    }
    await this.act(async () => {
      const { source } = await this.call('addCalendarSource', input);
      this._clearForm();
      if (source && !CalendarSourcesSection.NO_SIGN_IN_KINDS.includes(source.kind)) await this._connect(source.id);
    }, 'Calendar added.');
  }

  _clearForm() {
    for (const id of ['calLabel', 'calUrl', 'calSessionCalendar', 'calAuthUser', 'calClientId', 'calClientSecret', 'calCalendarId']) {
      const el = this.$(id);
      if (el) el.value = '';
    }
  }
}
