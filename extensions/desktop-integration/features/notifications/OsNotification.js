class OsNotification {
  static MAX_SHORT = 300;
  static MAX_TITLE = 500;
  static MAX_BODY = 4000;
  static MAX_LINES = 20;
  static MAX_LINE = 1000;
  static MAX_URI = 2048;
  static FUTURE_SLACK_MS = 5 * 60 * 1000;

  static normalize(raw, { now = new Date(), client = '' } = {}) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'A notification must be an object' };
    const str = (v, max) => OsNotification._str(v, max);
    let lines = Array.isArray(raw.lines) ? raw.lines.map((l) => str(l, OsNotification.MAX_LINE)).filter(Boolean).slice(0, OsNotification.MAX_LINES) : [];
    let title = str(raw.title, OsNotification.MAX_TITLE);
    let body = OsNotification._text(raw.body, OsNotification.MAX_BODY);
    if (!title && lines.length) title = lines[0].slice(0, OsNotification.MAX_TITLE);
    if (!body && lines.length) {
      const rest = lines[0] === title ? lines.slice(1) : lines;
      body = rest.join('\n').slice(0, OsNotification.MAX_BODY);
    }
    if (!lines.length) lines = [title, ...body.split(/\r?\n/)].map((l) => l.trim()).filter(Boolean).slice(0, OsNotification.MAX_LINES);
    const app = str(raw.app, OsNotification.MAX_SHORT);
    const appId = str(raw.appId, OsNotification.MAX_SHORT);
    if (!app && !appId) return { ok: false, error: 'A notification needs app or appId' };
    if (!title && !body) return { ok: false, error: 'A notification needs a title, body or lines' };
    return {
      ok: true,
      item: {
        app: app || appId,
        appId,
        title,
        body,
        lines,
        at: OsNotification._time(raw.at, now),
        tag: str(raw.tag, OsNotification.MAX_SHORT),
        group: str(raw.group, OsNotification.MAX_SHORT),
        launchUri: str(raw.launchUri, OsNotification.MAX_URI),
        imagePath: str(raw.imagePath, OsNotification.MAX_URI),
        client: str(client, OsNotification.MAX_SHORT),
        receivedAt: now.toISOString(),
      },
    };
  }

  static webUrl(uri) {
    try {
      const u = new URL(String(uri || ''));
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : '';
    } catch (_) {
      return '';
    }
  }

  static _str(v, max) {
    if (v == null || typeof v === 'object') return '';
    return String(v).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  static _text(v, max) {
    if (v == null || typeof v === 'object') return '';
    return String(v).replace(/\r\n?/g, '\n').replace(/[ \t\f\v]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
  }

  static _time(value, now) {
    let t = NaN;
    if (typeof value === 'number') t = value;
    else if (typeof value === 'string' && value.trim()) t = /^\d+$/.test(value.trim()) ? Number(value.trim()) : Date.parse(value);
    if (!Number.isFinite(t) || t <= 0 || t > now.getTime() + OsNotification.FUTURE_SLACK_MS) return now.toISOString();
    return new Date(t).toISOString();
  }
}

module.exports = OsNotification;
