const CalendarProvider = require('../CalendarProvider');
const IcsParser = require('../ics/IcsParser');
const IcsDateTime = require('../ics/IcsDateTime');
const RecurrenceExpander = require('../ics/RecurrenceExpander');
const GoogleCalendarId = require('../GoogleCalendarId');

class IcsCalendarProvider extends CalendarProvider {
  static KIND = 'ics';
  static TIMEOUT_MS = 20000;
  static MAX_BYTES = 10 * 1024 * 1024;
  static USER_AGENT = 'LumaBrowser Hub';

  validateConfig(config) {
    const url = IcsCalendarProvider.normalizeUrl(config && config.url);
    if (!url) return 'An ICS feed needs an http(s) or webcal URL.';
    return null;
  }

  static normalizeUrl(raw) {
    if (GoogleCalendarId.isGoogleLink(raw)) {
      const id = GoogleCalendarId.fromInput(raw);
      return id ? GoogleCalendarId.publicIcsUrl(id) : null;
    }
    const text = String(raw || '').trim().replace(/^webcal:\/\//i, 'https://');
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch (_) {
      return null;
    }
  }

  async fetchEvents(source, { from, to, fetchImpl } = {}) {
    const text = await this._download(IcsCalendarProvider.normalizeUrl(source.config && source.config.url), fetchImpl);
    const parsed = IcsParser.parse(text);
    const events = IcsCalendarProvider.expandAll(parsed.events, { from, to });
    return CalendarProvider.clipWindow(events, from, to);
  }

  static expandAll(vevents, { from, to }) {
    const chains = IcsCalendarProvider._chains(vevents);
    const out = [];
    for (const chain of chains.values()) {
      if (chain.master && chain.master.status === 'CANCELLED') continue;
      const overrides = new Map();
      for (const override of chain.overrides) {
        const key = IcsDateTime.toMs(override.recurrenceId);
        if (Number.isFinite(key)) overrides.set(key, override);
      }
      const base = chain.master || chain.overrides[0];
      const occurrences = chain.master
        ? RecurrenceExpander.expand(base, { from, to, overrides })
        : chain.overrides.map((o) => RecurrenceExpander.expand(o, { from, to })).flat();
      for (const occurrence of occurrences) {
        if (occurrence.vevent.status === 'CANCELLED') continue;
        out.push(IcsCalendarProvider.toEvent(occurrence));
      }
    }
    return out;
  }

  static toEvent({ start, end, vevent }) {
    const allDay = !!(vevent.dtstart && (vevent.dtstart.isDate || /^\d{8}$/.test(vevent.dtstart.value)));
    return {
      uid: vevent.uid,
      title: vevent.summary || '',
      description: vevent.description || '',
      location: vevent.location || '',
      startsAt: new Date(start).toISOString(),
      endsAt: end > start ? new Date(end).toISOString() : null,
      allDay,
      status: (vevent.status || 'CONFIRMED').toLowerCase(),
      url: vevent.url || '',
      organizer: vevent.organizer ? (vevent.organizer.email || vevent.organizer.name) : '',
      attendees: (vevent.attendees || []).map((a) => ({ name: a.name, email: a.email })),
    };
  }

  static _chains(vevents) {
    const chains = new Map();
    for (const vevent of vevents) {
      let chain = chains.get(vevent.uid);
      if (!chain) {
        chain = { master: null, overrides: [] };
        chains.set(vevent.uid, chain);
      }
      if (vevent.recurrenceId) chain.overrides.push(vevent);
      else chain.master = vevent;
    }
    return chains;
  }

  async _download(url, fetchImpl) {
    if (!url) throw new Error('The ICS feed URL is not valid.');
    const doFetch = fetchImpl || globalThis.fetch;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), IcsCalendarProvider.TIMEOUT_MS) : null;
    try {
      const response = await doFetch(url, {
        headers: { 'User-Agent': IcsCalendarProvider.USER_AGENT, Accept: 'text/calendar, text/plain, */*' },
        signal: controller ? controller.signal : undefined,
        redirect: 'follow',
      });
      if (!response.ok) throw new Error(`ICS feed returned HTTP ${response.status}`);
      const text = await response.text();
      if (text.length > IcsCalendarProvider.MAX_BYTES) throw new Error('ICS feed is larger than 10 MB');
      return text;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

module.exports = IcsCalendarProvider;
