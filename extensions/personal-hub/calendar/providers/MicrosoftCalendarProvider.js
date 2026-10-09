const CalendarProvider = require('../CalendarProvider');
const IcsDateTime = require('../ics/IcsDateTime');

class MicrosoftCalendarProvider extends CalendarProvider {
  static KIND = 'microsoft';
  static API = 'https://graph.microsoft.com/v1.0';
  static PAGE_SIZE = 200;
  static MAX_PAGES = 25;

  validateConfig(config) {
    if (!config || !String(config.clientId || '').trim()) return 'A Microsoft 365 calendar needs the application (client) id of your Entra app registration.';
    return null;
  }

  needsOAuth() {
    return true;
  }

  async fetchEvents(source, { from, to, credentials, fetchImpl } = {}) {
    const calendarId = source.config && source.config.calendarId;
    const base = calendarId
      ? `${MicrosoftCalendarProvider.API}/me/calendars/${encodeURIComponent(calendarId)}/calendarView`
      : `${MicrosoftCalendarProvider.API}/me/calendarView`;
    const first = new URL(base);
    first.searchParams.set('startDateTime', new Date(from).toISOString());
    first.searchParams.set('endDateTime', new Date(to).toISOString());
    first.searchParams.set('$top', String(MicrosoftCalendarProvider.PAGE_SIZE));
    first.searchParams.set('$orderby', 'start/dateTime');
    const items = [];
    let next = first.href;
    for (let page = 0; next && page < MicrosoftCalendarProvider.MAX_PAGES; page += 1) {
      const body = await MicrosoftCalendarProvider._get(next, credentials, fetchImpl);
      items.push(...(Array.isArray(body.value) ? body.value : []));
      next = body['@odata.nextLink'] || null;
    }
    return CalendarProvider.clipWindow(items.map(MicrosoftCalendarProvider.toEvent).filter(Boolean), from, to);
  }

  async listCalendars(credentials, fetchImpl) {
    const body = await MicrosoftCalendarProvider._get(`${MicrosoftCalendarProvider.API}/me/calendars`, credentials, fetchImpl);
    return (Array.isArray(body.value) ? body.value : []).map((c) => ({ id: c.id, name: c.name || c.id, primary: !!c.isDefaultCalendar }));
  }

  static toEvent(item) {
    if (!item || !item.start) return null;
    const allDay = !!item.isAllDay;
    const startsAt = MicrosoftCalendarProvider._when(item.start, allDay);
    const endsAt = item.end ? MicrosoftCalendarProvider._when(item.end, allDay) : null;
    if (!startsAt) return null;
    const organizer = item.organizer && item.organizer.emailAddress;
    return {
      uid: item.iCalUId || item.id,
      title: item.subject || '',
      description: item.bodyPreview || '',
      location: (item.location && item.location.displayName) || '',
      startsAt,
      endsAt,
      allDay,
      status: item.isCancelled ? 'cancelled' : 'confirmed',
      url: item.webLink || '',
      organizer: organizer ? (organizer.address || organizer.name || '') : '',
      attendees: (item.attendees || []).map((a) => ({
        name: (a.emailAddress && a.emailAddress.name) || '',
        email: (a.emailAddress && a.emailAddress.address) || '',
      })),
    };
  }

  static _when(part, allDay) {
    const text = String(part.dateTime || '');
    if (allDay) {
      const ms = IcsDateTime.dateOnlyToMs(text.slice(0, 10));
      return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
    }
    const trimmed = text.replace(/(\.\d{3})\d*$/, '$1');
    const ms = Date.parse(/[Zz]|[+-]\d{2}:\d{2}$/.test(trimmed) ? trimmed : `${trimmed}Z`);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }

  static async _get(url, credentials, fetchImpl) {
    const doFetch = fetchImpl || globalThis.fetch;
    const token = credentials && credentials.accessToken;
    if (!token) throw new Error('Microsoft 365: sign in first');
    const response = await doFetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', Prefer: 'outlook.timezone="UTC"' },
    });
    if (!response.ok) throw new Error(`Microsoft 365: HTTP ${response.status}`);
    return response.json();
  }
}

module.exports = MicrosoftCalendarProvider;
