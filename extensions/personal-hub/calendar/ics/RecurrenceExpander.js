const IcsDateTime = require('./IcsDateTime');

class RecurrenceExpander {
  static WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  static MAX_PERIODS = 5000;

  static expand(vevent, { from, to, maxOccurrences = 1000, overrides = null } = {}) {
    const fromMs = RecurrenceExpander._ms(from, -Infinity);
    const toMs = RecurrenceExpander._ms(to, Infinity);
    const startMs = IcsDateTime.toMs(vevent.dtstart);
    if (!Number.isFinite(startMs)) return [];
    const duration = RecurrenceExpander.durationMs(vevent, startMs);
    const occurrences = vevent.rrule
      ? RecurrenceExpander._recurring(vevent, { startMs, duration, fromMs, toMs, maxOccurrences })
      : [{ start: startMs, end: startMs + duration, vevent }];
    const withOverrides = RecurrenceExpander._applyOverrides(occurrences, overrides, vevent);
    return withOverrides
      .filter((o) => RecurrenceExpander._overlaps(o, fromMs, toMs))
      .sort((a, b) => a.start - b.start);
  }

  static durationMs(vevent, startMs) {
    if (vevent.dtend) {
      const endMs = IcsDateTime.toMs(vevent.dtend);
      if (Number.isFinite(endMs)) return Math.max(0, endMs - startMs);
    }
    if (vevent.duration) return RecurrenceExpander.parseDuration(vevent.duration);
    return vevent.dtstart && vevent.dtstart.isDate ? IcsDateTime.DAY_MS : 0;
  }

  static parseDuration(text) {
    const match = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(text).trim());
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    const weeks = +(match[2] || 0);
    const days = +(match[3] || 0);
    const hours = +(match[4] || 0);
    const minutes = +(match[5] || 0);
    const seconds = +(match[6] || 0);
    return sign * (((weeks * 7 + days) * 24 + hours) * 3600 + minutes * 60 + seconds) * 1000;
  }

  static parseRule(text) {
    const rule = { freq: '', interval: 1, count: null, until: null, byDay: [], byMonthDay: [], byMonth: [] };
    for (const part of String(text || '').split(';')) {
      const eq = part.indexOf('=');
      if (eq < 0) continue;
      const key = part.slice(0, eq).toUpperCase();
      const value = part.slice(eq + 1);
      if (key === 'FREQ') rule.freq = value.toUpperCase();
      else if (key === 'INTERVAL') rule.interval = Math.max(1, parseInt(value, 10) || 1);
      else if (key === 'COUNT') rule.count = Math.max(0, parseInt(value, 10) || 0);
      else if (key === 'UNTIL') rule.until = value;
      else if (key === 'BYDAY') rule.byDay = value.split(',').map(RecurrenceExpander._parseByDay).filter(Boolean);
      else if (key === 'BYMONTHDAY') rule.byMonthDay = value.split(',').map((v) => parseInt(v, 10)).filter((n) => n && Math.abs(n) <= 31);
      else if (key === 'BYMONTH') rule.byMonth = value.split(',').map((v) => parseInt(v, 10)).filter((n) => n >= 1 && n <= 12);
    }
    return rule;
  }

  static _recurring(vevent, { startMs, duration, fromMs, toMs, maxOccurrences }) {
    const rule = RecurrenceExpander.parseRule(vevent.rrule);
    const generator = RecurrenceExpander._generators()[rule.freq];
    if (!generator) return [{ start: startMs, end: startMs + duration, vevent }];
    const dtstart = IcsDateTime.parseComponents(vevent.dtstart.value);
    const isDate = !!(vevent.dtstart.isDate || dtstart.dateOnly);
    const tzid = vevent.dtstart.tzid;
    const untilMs = rule.until ? IcsDateTime.toMs({ value: rule.until, tzid, isDate: /^\d{8}$/.test(rule.until) }) : Infinity;
    const exdates = new Set(vevent.exdates.map((ex) => IcsDateTime.toMs(ex)).filter(Number.isFinite));
    const anchor = RecurrenceExpander._wall(dtstart);
    const out = [];
    let generated = 0;
    for (let period = 0; period < RecurrenceExpander.MAX_PERIODS; period += 1) {
      const candidates = generator(anchor, period * rule.interval, rule);
      let periodStartMs = Infinity;
      for (const wall of candidates) {
        if (wall < anchor) continue;
        if (rule.byMonth.length && !rule.byMonth.includes(wall.getUTCMonth() + 1)) continue;
        const start = IcsDateTime.componentsToMs(RecurrenceExpander._components(wall, dtstart), tzid, isDate);
        periodStartMs = Math.min(periodStartMs, start);
        if (start > untilMs) return out;
        generated += 1;
        if (rule.count != null && generated > rule.count) return out;
        if (!exdates.has(start)) out.push({ start, end: start + duration, vevent });
        if (out.length >= maxOccurrences) return out;
      }
      if (periodStartMs >= toMs && candidates.length) return out;
      if (!candidates.length && period > 0 && RecurrenceExpander._periodStart(anchor, period * rule.interval, rule.freq) > toMs) return out;
    }
    return out;
  }

  static _generators() {
    return {
      DAILY: (anchor, offset, rule) => {
        const day = RecurrenceExpander._addDays(anchor, offset);
        if (rule.byDay.length && !rule.byDay.some((b) => b.day === day.getUTCDay())) return [];
        if (rule.byMonthDay.length && !RecurrenceExpander._matchesMonthDay(day, rule.byMonthDay)) return [];
        return [day];
      },
      WEEKLY: (anchor, offset, rule) => {
        const weekStart = RecurrenceExpander._addDays(RecurrenceExpander._startOfWeek(anchor), offset * 7);
        const days = rule.byDay.length ? rule.byDay.map((b) => b.day) : [anchor.getUTCDay()];
        return days.map((weekday) => RecurrenceExpander._addDays(weekStart, (weekday - 1 + 7) % 7)).sort((a, b) => a - b);
      },
      MONTHLY: (anchor, offset, rule) => {
        const month = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + offset, 1, anchor.getUTCHours(), anchor.getUTCMinutes(), anchor.getUTCSeconds());
        return RecurrenceExpander._daysInMonth(new Date(month), rule, anchor);
      },
      YEARLY: (anchor, offset, rule) => {
        const year = anchor.getUTCFullYear() + offset;
        const months = rule.byMonth.length ? rule.byMonth : [anchor.getUTCMonth() + 1];
        const days = [];
        for (const m of months) {
          const month = new Date(Date.UTC(year, m - 1, 1, anchor.getUTCHours(), anchor.getUTCMinutes(), anchor.getUTCSeconds()));
          days.push(...RecurrenceExpander._daysInMonth(month, rule, anchor));
        }
        return days.sort((a, b) => a - b);
      },
    };
  }

  static _daysInMonth(monthStart, rule, anchor) {
    const year = monthStart.getUTCFullYear();
    const month = monthStart.getUTCMonth();
    const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const at = (day) => new Date(Date.UTC(year, month, day, anchor.getUTCHours(), anchor.getUTCMinutes(), anchor.getUTCSeconds()));
    if (rule.byMonthDay.length) {
      return rule.byMonthDay.map((n) => (n > 0 ? n : length + 1 + n)).filter((d) => d >= 1 && d <= length).sort((a, b) => a - b).map(at);
    }
    if (rule.byDay.length) {
      const days = [];
      for (const spec of rule.byDay) days.push(...RecurrenceExpander._weekdaysInMonth(year, month, length, spec));
      return [...new Set(days)].sort((a, b) => a - b).map(at);
    }
    const day = anchor.getUTCDate();
    return day <= length ? [at(day)] : [];
  }

  static _weekdaysInMonth(year, month, length, { ord, day }) {
    const matches = [];
    for (let d = 1; d <= length; d += 1) {
      if (new Date(Date.UTC(year, month, d)).getUTCDay() === day) matches.push(d);
    }
    if (!ord) return matches;
    const picked = ord > 0 ? matches[ord - 1] : matches[matches.length + ord];
    return picked ? [picked] : [];
  }

  static _applyOverrides(occurrences, overrides, master) {
    if (!overrides || !overrides.size) return occurrences;
    const consumed = new Set();
    const out = occurrences.map((o) => {
      const override = overrides.get(o.start);
      if (!override) return o;
      consumed.add(o.start);
      return RecurrenceExpander._overrideOccurrence(override);
    });
    for (const [key, override] of overrides) {
      if (!consumed.has(key) && override !== master) out.push(RecurrenceExpander._overrideOccurrence(override));
    }
    return out;
  }

  static _overrideOccurrence(override) {
    const start = IcsDateTime.toMs(override.dtstart);
    return { start, end: start + RecurrenceExpander.durationMs(override, start), vevent: override };
  }

  static _overlaps(o, fromMs, toMs) {
    if (!Number.isFinite(o.start) || o.start >= toMs) return false;
    return o.end > fromMs || (o.end === o.start && o.start >= fromMs);
  }

  static _parseByDay(text) {
    const match = /^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/i.exec(text.trim());
    if (!match) return null;
    return { ord: match[1] ? parseInt(match[1], 10) : 0, day: RecurrenceExpander.WEEKDAYS.indexOf(match[2].toUpperCase()) };
  }

  static _matchesMonthDay(day, byMonthDay) {
    const length = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 0)).getUTCDate();
    return byMonthDay.some((n) => (n > 0 ? n : length + 1 + n) === day.getUTCDate());
  }

  static _wall(c) {
    return new Date(Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi, c.s));
  }

  static _components(wall, dtstart) {
    return {
      y: wall.getUTCFullYear(), m: wall.getUTCMonth() + 1, d: wall.getUTCDate(),
      h: wall.getUTCHours(), mi: wall.getUTCMinutes(), s: wall.getUTCSeconds(), utc: dtstart.utc, dateOnly: dtstart.dateOnly,
    };
  }

  static _addDays(wall, n) {
    return new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + n, wall.getUTCHours(), wall.getUTCMinutes(), wall.getUTCSeconds()));
  }

  static _startOfWeek(wall) {
    return RecurrenceExpander._addDays(wall, -((wall.getUTCDay() + 6) % 7));
  }

  static _periodStart(anchor, offset, freq) {
    if (freq === 'DAILY') return RecurrenceExpander._addDays(anchor, offset).getTime();
    if (freq === 'WEEKLY') return RecurrenceExpander._addDays(anchor, offset * 7).getTime();
    if (freq === 'MONTHLY') return Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + offset, 1);
    return Date.UTC(anchor.getUTCFullYear() + offset, 0, 1);
  }

  static _ms(value, fallback) {
    if (value == null) return fallback;
    const ms = typeof value === 'number' ? value : Date.parse(value);
    return Number.isFinite(ms) ? ms : fallback;
  }
}

module.exports = RecurrenceExpander;
