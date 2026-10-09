const CalendarProvider = require('../CalendarProvider');
const GoogleCalendarId = require('../GoogleCalendarId');
const GoogleCalendarProvider = require('./GoogleCalendarProvider');
const IcsCalendarProvider = require('./IcsCalendarProvider');
const SapisidHash = require('../session/SapisidHash');
const SessionCookies = require('../session/SessionCookies');

class GoogleSessionCalendarProvider extends CalendarProvider {
  static KIND = 'google-session';
  static API_HOST = 'clients6.google.com';
  static API = 'https://clients6.google.com/calendar/v3';
  static ORIGIN = 'https://calendar.google.com';
  static COOKIE_DOMAIN = 'google.com';
  static EMBED_API_KEY = 'AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs';
  static PAGE_SIZE = 250;
  static MAX_PAGES = 40;
  static NOT_SIGNED_IN = 'Google Calendar: no signed-in Google session was found in the browser, and the calendar is not public. Open calendar.google.com in a persisted tab and sign in, or make the calendar public.';

  constructor({ getCookies = SessionCookies.reader(), icsProvider = new IcsCalendarProvider(), now = () => Date.now() } = {}) {
    super();
    this._getCookies = getCookies;
    this._ics = icsProvider;
    this._now = now;
  }

  validateConfig(config) {
    const id = GoogleSessionCalendarProvider.calendarIdOf(config);
    if (!id) return 'Paste the calendar\'s embed link, share link, iCal address or id (something@group.calendar.google.com).';
    return null;
  }

  static calendarIdOf(config) {
    const c = config || {};
    return GoogleCalendarId.fromInput(c.calendarId) || GoogleCalendarId.fromInput(c.calendar);
  }

  async fetchEvents(source, { from, to, fetchImpl } = {}) {
    const config = (source && source.config) || {};
    const calendarId = GoogleSessionCalendarProvider.calendarIdOf(config);
    if (!calendarId) throw new Error('Google Calendar: the calendar id is missing.');
    const cookies = await this._cookiesFor(config);
    const sapisid = SapisidHash.sapisidOf(cookies);
    if (sapisid) {
      try {
        return await this._fetchWithSession(calendarId, config, cookies, sapisid, { from, to, fetchImpl });
      } catch (err) {
        return this._publicFallback(calendarId, { from, to, fetchImpl }, err);
      }
    }
    return this._publicFallback(calendarId, { from, to, fetchImpl }, null);
  }

  async _fetchWithSession(calendarId, config, cookies, sapisid, { from, to, fetchImpl }) {
    const headers = this._headers(cookies, sapisid, config);
    const base = `${GoogleSessionCalendarProvider.API}/calendars/${encodeURIComponent(calendarId)}/events`;
    const items = [];
    let pageToken = null;
    for (let page = 0; page < GoogleSessionCalendarProvider.MAX_PAGES; page += 1) {
      const url = GoogleSessionCalendarProvider._pageUrl(base, config, from, to, pageToken);
      const body = await GoogleSessionCalendarProvider._get(url, headers, fetchImpl);
      items.push(...(Array.isArray(body.items) ? body.items : []));
      pageToken = body.nextPageToken || null;
      if (!pageToken) break;
    }
    return CalendarProvider.clipWindow(items.map(GoogleCalendarProvider.toEvent).filter(Boolean), from, to);
  }

  async _publicFallback(calendarId, { from, to, fetchImpl }, sessionError) {
    const url = GoogleCalendarId.publicIcsUrl(calendarId);
    try {
      return await this._ics.fetchEvents({ config: { url } }, { from, to, fetchImpl });
    } catch (icsError) {
      if (sessionError) throw new Error(`${sessionError.message} (public feed also failed: ${icsError.message})`);
      throw new Error(GoogleSessionCalendarProvider.NOT_SIGNED_IN);
    }
  }

  async _cookiesFor(config) {
    try {
      const cookies = await this._getCookies({ partition: config.partition || SessionCookies.DEFAULT_PARTITION, domain: GoogleSessionCalendarProvider.COOKIE_DOMAIN });
      return Array.isArray(cookies) ? cookies : [];
    } catch (_) {
      return [];
    }
  }

  _headers(cookies, sapisid, config) {
    const headers = {
      Authorization: SapisidHash.header(sapisid, GoogleSessionCalendarProvider.ORIGIN, this._now()),
      Cookie: SapisidHash.cookieHeader(cookies, GoogleSessionCalendarProvider.API_HOST),
      Origin: GoogleSessionCalendarProvider.ORIGIN,
      Referer: `${GoogleSessionCalendarProvider.ORIGIN}/`,
      Accept: 'application/json',
    };
    const authUser = parseInt(config.authUser, 10);
    if (Number.isFinite(authUser) && authUser >= 0) headers['X-Goog-AuthUser'] = String(authUser);
    return headers;
  }

  static _pageUrl(base, config, from, to, pageToken) {
    const url = new URL(base);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', new Date(from).toISOString());
    url.searchParams.set('timeMax', new Date(to).toISOString());
    url.searchParams.set('maxResults', String(GoogleSessionCalendarProvider.PAGE_SIZE));
    url.searchParams.set('key', String(config.apiKey || GoogleSessionCalendarProvider.EMBED_API_KEY));
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    return url.href;
  }

  static async _get(url, headers, fetchImpl) {
    const doFetch = fetchImpl || globalThis.fetch;
    const response = await doFetch(url, { headers });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Google Calendar: the signed-in session was refused (HTTP ${response.status}${await GoogleSessionCalendarProvider._reason(response)}); sign in again in the Google tab or check the account (authUser)`);
    }
    if (!response.ok) throw new Error(`Google Calendar: HTTP ${response.status}${await GoogleSessionCalendarProvider._reason(response)}`);
    return response.json();
  }

  static async _reason(response) {
    try {
      const text = typeof response.text === 'function' ? await response.text() : '';
      if (!text) return '';
      try {
        const body = JSON.parse(text);
        const message = body && body.error && (body.error.message || (Array.isArray(body.error.errors) && body.error.errors[0] && body.error.errors[0].message));
        return message ? `, ${String(message).slice(0, 200)}` : '';
      } catch (_) {}
      return `, ${text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)}`;
    } catch (_) {
      return '';
    }
  }
}

module.exports = GoogleSessionCalendarProvider;
