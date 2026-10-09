class GoogleCalendarId {
  static HOST = 'calendar.google.com';
  static ID_PATTERN = /^[A-Za-z0-9._%+#-]+@[A-Za-z0-9.-]+$/;

  static fromInput(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    if (GoogleCalendarId.ID_PATTERN.test(raw)) return raw;
    let url;
    try { url = new URL(raw.replace(/^webcal:\/\//i, 'https://')); } catch (_) { return null; }
    if (!url.hostname.endsWith(GoogleCalendarId.HOST)) return null;
    return GoogleCalendarId._fromEmbed(url) || GoogleCalendarId._fromShareLink(url) || GoogleCalendarId._fromIcal(url);
  }

  static isGoogleLink(text) {
    const raw = String(text || '').trim();
    if (GoogleCalendarId.ID_PATTERN.test(raw)) return true;
    try {
      const url = new URL(raw.replace(/^webcal:\/\//i, 'https://'));
      return url.hostname.endsWith(GoogleCalendarId.HOST) && !/\.ics$/i.test(url.pathname);
    } catch (_) {
      return false;
    }
  }

  static publicIcsUrl(calendarId) {
    return `https://${GoogleCalendarId.HOST}/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
  }

  static _fromEmbed(url) {
    const src = url.searchParams.get('src');
    return src && GoogleCalendarId.ID_PATTERN.test(src) ? src : null;
  }

  static _fromShareLink(url) {
    const cid = url.searchParams.get('cid');
    if (!cid) return null;
    try {
      const decoded = Buffer.from(cid, 'base64').toString('utf8');
      return GoogleCalendarId.ID_PATTERN.test(decoded) ? decoded : null;
    } catch (_) {
      return null;
    }
  }

  static _fromIcal(url) {
    const match = /^\/calendar\/ical\/([^/]+)\//.exec(url.pathname);
    if (!match) return null;
    const id = decodeURIComponent(match[1]);
    return GoogleCalendarId.ID_PATTERN.test(id) ? id : null;
  }
}

module.exports = GoogleCalendarId;
