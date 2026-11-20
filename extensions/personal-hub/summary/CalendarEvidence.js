const ActivityKind = require('../inbox/ActivityKind');
const ThreadKey = require('../inbox/ThreadKey');

class CalendarEvidence {
  static DAYS_AHEAD = 14;
  static PER_ITEM = 3;
  static MIN_SUBJECT = 4;
  static WITH_SENDER_MAX = 2;
  static CANCELLED = /^cancel/i;

  constructor({ calendar, now = () => new Date() }) {
    this._calendar = calendar;
    this._now = now;
  }

  forItems(items) {
    const coming = this._coming();
    const found = {};
    if (!coming.length) return found;
    for (const item of items || []) {
      const meetings = coming.filter((event) => CalendarEvidence.bearsOn(event, item)).slice(0, CalendarEvidence.PER_ITEM);
      if (meetings.length) found[item.id] = meetings.map(CalendarEvidence._brief);
    }
    return found;
  }

  static bearsOn(event, item) {
    const subject = ThreadKey.normalize(item && item.title);
    if (subject.length >= CalendarEvidence.MIN_SUBJECT && ThreadKey.normalize(event.title) === subject) return true;
    const sender = ((item && item.lastNotification) || {}).sender || '';
    const attendees = event.attendees || [];
    if (attendees.length > CalendarEvidence.WITH_SENDER_MAX || !ActivityKind.isDirect(item, sender)) return false;
    return attendees.some((attendee) => CalendarEvidence.isPerson(attendee, sender));
  }

  static isPerson(attendee, sender) {
    const written = String(sender || '').toLowerCase();
    const email = String((attendee && attendee.email) || '').toLowerCase();
    if (email && written.includes(email)) return true;
    const words = written.replace(/<[^>]*>/g, ' ').replace(/[^\p{L}\s]+/gu, ' ').split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;
    const full = words.join(' ');
    if (String((attendee && attendee.name) || '').toLowerCase().replace(/\s+/g, ' ').trim() === full) return true;
    const [first, last] = [words[0], words[words.length - 1]];
    const local = email.split('@')[0].replace(/[^a-z]+/g, '');
    return !!local && [`${first}${last}`, `${first[0]}${last}`, `${last}${first}`, `${first}${last[0]}`].includes(local);
  }

  _coming() {
    const now = this._now();
    let events = [];
    try {
      events = this._calendar.listEvents({ from: now.toISOString(), to: new Date(now.getTime() + CalendarEvidence.DAYS_AHEAD * 86400000).toISOString() }) || [];
    } catch (_) {
      return [];
    }
    return events
      .filter((event) => event.status !== 'cancelled' && !CalendarEvidence.CANCELLED.test(event.title || ''))
      .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
  }

  static _brief(event) {
    return {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt || null,
      allDay: !!event.allDay,
      attendees: (event.attendees || []).map((a) => a.name || a.email).filter(Boolean),
      organizer: event.organizer || '',
    };
  }
}

module.exports = CalendarEvidence;
