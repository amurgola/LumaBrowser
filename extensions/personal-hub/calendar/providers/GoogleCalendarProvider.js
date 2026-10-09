const CalendarProvider = require('../CalendarProvider');
const IcsDateTime = require('../ics/IcsDateTime');

class GoogleCalendarProvider extends CalendarProvider {
  static KIND = 'google';
  static API = 'https://www.googleapis.com/calendar/v3';
  static PAGE_SIZE = 2500;
  static MAX_PAGES = 20;

  validateConfig(config) {
    if (!config || !String(config.clientId || '').trim()) return 'A Google calendar needs the OAuth client id of your Google Cloud app.';
    return null;
  }

  needsOAuth() {
    return true;
  }

  async fetchEvents(source, { from, to, credentials, fetchImpl } = {}) {
    const calendarId = encodeURIComponent((source.config && source.config.calendarId) || 'primary');
    const base = `${GoogleCalendarProvider.API}/calendars/${calendarId}/events`;
    const items = [];
    let pageToken = null;
    for (let page = 0; page < GoogleCalendarProvider.MAX_PAGES; page += 1) {
      const url = new URL(base);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('timeMin', new Date(from).toISOString());
      url.searchParams.set('timeMax', new Date(to).toISOString());
      url.searchParams.set('maxResults', String(GoogleCalendarProvider.PAGE_SIZE));
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const body = await GoogleCalendarProvider._get(url.href, credentials, fetchImpl);
      items.push(...(Array.isArray(body.items) ? body.items : []));
      pageToken = body.nextPageToken || null;
      if (!pageToken) break;
    }
    return CalendarProvider.clipWindow(items.map(GoogleCalendarProvider.toEvent).filter(Boolean), from, to);
  }

  async listCalendars(credentials, fetchImpl) {
    const body = await GoogleCalendarProvider._get(`${GoogleCalendarProvider.API}/users/me/calendarList`, credentials, fetchImpl);
    return (Array.isArray(body.items) ? body.items : []).map((c) => ({ id: c.id, name: c.summaryOverride || c.summary || c.id, primary: !!c.primary }));
  }

  static toEvent(item) {
    if (!item || !item.start) return null;
    const allDay = !!item.start.date;
    const startsAt = GoogleCalendarProvider._when(item.start, allDay);
    const endsAt = item.end ? GoogleCalendarProvider._when(item.end, allDay) : null;
    if (!startsAt) return null;
    return {
      uid: item.iCalUID || item.id,
      title: item.summary || '',
      description: item.description || '',
      location: item.location || '',
      startsAt,
      endsAt,
      allDay,
      status: (item.status || 'confirmed').toLowerCase(),
      url: item.htmlLink || '',
      organizer: item.organizer ? (item.organizer.email || item.organizer.displayName || '') : '',
      attendees: (item.attendees || []).map((a) => ({ name: a.displayName || '', email: a.email || '' })),
    };
  }

  static _when(part, allDay) {
    if (allDay) {
      const ms = IcsDateTime.dateOnlyToMs(part.date);
      return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
    }
    const ms = Date.parse(part.dateTime);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }

  static async _get(url, credentials, fetchImpl) {
    const doFetch = fetchImpl || globalThis.fetch;
    const token = credentials && credentials.accessToken;
    if (!token) throw new Error('Google Calendar: sign in first');
    const response = await doFetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Google Calendar: HTTP ${response.status}`);
    return response.json();
  }
}

module.exports = GoogleCalendarProvider;
