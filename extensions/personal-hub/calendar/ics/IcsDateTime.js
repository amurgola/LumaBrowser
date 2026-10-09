class IcsDateTime {
  static WINDOWS_ZONES = {
    'Eastern Standard Time': 'America/New_York',
    'Central Standard Time': 'America/Chicago',
    'Mountain Standard Time': 'America/Denver',
    'US Mountain Standard Time': 'America/Phoenix',
    'Pacific Standard Time': 'America/Los_Angeles',
    'Alaskan Standard Time': 'America/Anchorage',
    'Hawaiian Standard Time': 'Pacific/Honolulu',
    'Atlantic Standard Time': 'America/Halifax',
    'UTC': 'UTC',
    'GMT Standard Time': 'Europe/London',
    'W. Europe Standard Time': 'Europe/Berlin',
    'Central Europe Standard Time': 'Europe/Budapest',
    'Central European Standard Time': 'Europe/Warsaw',
    'Romance Standard Time': 'Europe/Paris',
    'E. Europe Standard Time': 'Europe/Chisinau',
    'FLE Standard Time': 'Europe/Kiev',
    'Russian Standard Time': 'Europe/Moscow',
    'AUS Eastern Standard Time': 'Australia/Sydney',
    'AUS Central Standard Time': 'Australia/Darwin',
    'W. Australia Standard Time': 'Australia/Perth',
    'New Zealand Standard Time': 'Pacific/Auckland',
    'India Standard Time': 'Asia/Kolkata',
    'Tokyo Standard Time': 'Asia/Tokyo',
    'China Standard Time': 'Asia/Shanghai',
    'Singapore Standard Time': 'Asia/Singapore',
    'Korea Standard Time': 'Asia/Seoul',
    'SA Pacific Standard Time': 'America/Bogota',
    'E. South America Standard Time': 'America/Sao_Paulo',
    'South Africa Standard Time': 'Africa/Johannesburg',
    'Arabian Standard Time': 'Asia/Dubai',
    'Israel Standard Time': 'Asia/Jerusalem',
  };

  static DAY_MS = 24 * 60 * 60 * 1000;

  static toIso(dt) {
    const ms = IcsDateTime.toMs(dt);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }

  static toMs(dt) {
    if (!dt || !dt.value) return NaN;
    const parts = IcsDateTime.parseComponents(dt.value);
    if (!parts) return NaN;
    return IcsDateTime.componentsToMs(parts, dt.tzid, dt.isDate || parts.dateOnly);
  }

  static parseComponents(value) {
    const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(value).trim());
    if (!match) return null;
    return {
      y: +match[1], m: +match[2], d: +match[3],
      h: +(match[4] || 0), mi: +(match[5] || 0), s: +(match[6] || 0),
      utc: match[7] === 'Z',
      dateOnly: match[4] === undefined,
    };
  }

  static componentsToMs(c, tzid, isDate) {
    if (isDate) return new Date(c.y, c.m - 1, c.d).getTime();
    if (c.utc) return Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi, c.s);
    const iana = IcsDateTime.resolveIana(tzid);
    if (!iana) return new Date(c.y, c.m - 1, c.d, c.h, c.mi, c.s).getTime();
    return IcsDateTime._zonedToUtc(c, iana);
  }

  static dateOnlyToMs(value) {
    const digits = String(value || '').replace(/-/g, '');
    const c = IcsDateTime.parseComponents(digits);
    return c ? new Date(c.y, c.m - 1, c.d).getTime() : NaN;
  }

  static addLocalDays(ms, n) {
    const d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds()).getTime();
  }

  static resolveIana(tzid) {
    if (!tzid) return null;
    const trimmed = String(tzid).trim().replace(/^"|"$/g, '');
    if (IcsDateTime.WINDOWS_ZONES[trimmed]) return IcsDateTime.WINDOWS_ZONES[trimmed];
    if (IcsDateTime.isIana(trimmed)) return trimmed;
    const segments = trimmed.replace(/^\//, '').split('/');
    for (let take = Math.min(3, segments.length); take >= 1; take -= 1) {
      const candidate = segments.slice(segments.length - take).join('/');
      if (IcsDateTime.isIana(candidate)) return candidate;
    }
    return 'UTC';
  }

  static isIana(name) {
    if (!name || !/^[A-Za-z_+\-/0-9]+$/.test(name)) return false;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: name });
      return true;
    } catch (_) {
      return false;
    }
  }

  static zoneOffsetMinutes(iana, utcMs) {
    const formatter = IcsDateTime._formatter(iana);
    const parts = {};
    for (const part of formatter.formatToParts(new Date(utcMs))) parts[part.type] = part.value;
    const hour = parts.hour === '24' ? 0 : +parts.hour;
    const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, hour, +parts.minute, +parts.second);
    return Math.round((wall - IcsDateTime._floorSecond(utcMs)) / 60000);
  }

  static _zonedToUtc(c, iana) {
    const guess = Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi, c.s);
    const offset1 = IcsDateTime.zoneOffsetMinutes(iana, guess);
    const utc1 = guess - offset1 * 60000;
    const offset2 = IcsDateTime.zoneOffsetMinutes(iana, utc1);
    return offset2 === offset1 ? utc1 : guess - offset2 * 60000;
  }

  static _formatter(iana) {
    if (!IcsDateTime._formatters) IcsDateTime._formatters = new Map();
    let formatter = IcsDateTime._formatters.get(iana);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: iana, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      IcsDateTime._formatters.set(iana, formatter);
    }
    return formatter;
  }

  static _floorSecond(ms) {
    return Math.floor(ms / 1000) * 1000;
  }
}

module.exports = IcsDateTime;
