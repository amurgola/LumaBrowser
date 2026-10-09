import HubWidgetBase from './HubWidgetBase.js';
import WidgetDom from './WidgetDom.js';

export default class HubAgendaWidget extends HubWidgetBase {
  static REFRESH_EVENTS = ['calendar.synced', 'calendar.changed'];
  static ATTENTION_AREA = 'calendar';
  static NO_CALENDARS = 'No calendars yet. Tick the calendars of your signed-in Google or Microsoft tabs in Settings > Hub > Connections.';
  static RANGES = [{ days: 1, label: 'Today' }, { days: 7, label: 'Week' }];

  static mount(root, host) {
    return new HubAgendaWidget(root, host).mount();
  }

  constructor(root, host) {
    super(root, host);
    this._days = 1;
  }

  get days() {
    return this._days;
  }

  _renderShell() {
    const seg = WidgetDom.el('div', { class: 'hub-seg hub-range' }, HubAgendaWidget.RANGES.map((r) => WidgetDom.el('button', {
      type: 'button', text: r.label, data: { days: String(r.days) }, on: { click: () => this._setDays(r.days) },
    })));
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-head' }, [
      WidgetDom.el('h2', { class: 'hub-title', text: 'Agenda' }),
      WidgetDom.el('span', { class: 'hub-sub hub-date', text: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) }),
      WidgetDom.el('span', { class: 'hub-spacer' }),
      seg,
    ]));
    this.root.appendChild(this._errorLine());
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-body hub-days' }));
    this._paintRange();
  }

  _setDays(days) {
    if (this._days === days) return;
    this._days = days;
    this._paintRange();
    this.refresh();
  }

  _paintRange() {
    for (const btn of this.root.querySelectorAll('.hub-range button')) {
      btn.classList.toggle('is-on', Number(btn.dataset.days) === this._days);
    }
  }

  async _load() {
    const events = (await this.host.call('listEvents', { days: this._days })) || [];
    if (!events.length) {
      try {
        const sources = await this.host.call('listCalendarSources');
        this._hasSources = !Array.isArray(sources) || sources.length > 0;
      } catch (_) {
        this._hasSources = true;
      }
    }
    return events;
  }

  _paint() {
    const body = this.root.querySelector('.hub-days');
    body.innerHTML = '';
    const groups = HubAgendaWidget._groupByDay(this._data);
    if (!groups.length) {
      if (this._hasSources === false) body.appendChild(this._empty(HubAgendaWidget.NO_CALENDARS));
      else body.appendChild(this._empty(this._days === 1 ? 'Nothing on the calendar today.' : 'Nothing on the calendar this week.'));
      return;
    }
    const now = Date.now();
    for (const group of groups) body.appendChild(this._day(group, now));
  }

  static _groupByDay(events) {
    const byDay = new Map();
    for (const event of events || []) {
      const key = WidgetDom.dayKey(event.startsAt);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(event);
    }
    return [...byDay.keys()].sort().map((key) => ({
      key,
      events: byDay.get(key).sort((a, b) => (b.allDay - a.allDay) || String(a.startsAt).localeCompare(String(b.startsAt))),
    }));
  }

  _day(group, now) {
    const isToday = group.key === WidgetDom.dayKey(null, now);
    const rows = [];
    let nowPlaced = !isToday;
    for (const event of group.events) {
      const past = !event.allDay && HubAgendaWidget._endOf(event) < now;
      if (!nowPlaced && !event.allDay && new Date(event.startsAt).getTime() > now) {
        rows.push(WidgetDom.el('div', { class: 'hub-now', text: 'now' }));
        nowPlaced = true;
      }
      rows.push(this._event(event, past));
    }
    if (!nowPlaced) rows.push(WidgetDom.el('div', { class: 'hub-now', text: 'now' }));
    return WidgetDom.el('div', { class: 'hub-day', data: { day: group.key } }, [
      WidgetDom.el('div', { class: 'hub-day-label', text: WidgetDom.dayLabel(group.key, now) }),
      ...rows,
    ]);
  }

  _event(event, past) {
    const sub = [event.location, event.sourceLabel].filter(Boolean).join(' / ');
    const row = WidgetDom.el('div', {
      class: `hub-event${event.url ? ' has-url' : ''}${past ? ' is-past' : ''}`,
      data: { event: event.id },
      title: event.sourceLabel || '',
    }, [
      WidgetDom.el('span', { class: 'hub-event-bar', style: event.sourceColor ? `background:${WidgetDom.esc(event.sourceColor)}` : null }),
      WidgetDom.el('span', { class: 'hub-event-time', text: WidgetDom.formatTimeRange(event.startsAt, event.endsAt, event.allDay) }),
      WidgetDom.el('span', { class: 'hub-event-main' }, [
        WidgetDom.el('div', { class: 'hub-event-title', text: event.title || '(no title)' }),
        sub ? WidgetDom.el('div', { class: 'hub-event-sub', text: sub }) : null,
      ]),
    ]);
    if (event.url) row.addEventListener('click', () => this._openUrl(event.url));
    return row;
  }

  static _endOf(event) {
    const end = new Date(event.endsAt || event.startsAt).getTime();
    return Number.isNaN(end) ? 0 : end;
  }
}
