class BirthDate {
  static MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  static EARLIEST_YEAR = 1900;
  static SOON_DAYS = 14;
  static DAY_MS = 86400000;
  static HINT = 'Try 1992-10-31, October 31 1992, or 10-31 when the year is unknown.';

  static parse(text, { now = new Date() } = {}) {
    const raw = BirthDate._tidy(text);
    if (!raw) return '';
    const parts = BirthDate._numeric(raw) || BirthDate._named(raw);
    if (!parts || !BirthDate._real(parts, now)) throw new Error(`"${String(text).trim()}" does not read as a birth date. ${BirthDate.HINT}`);
    return BirthDate._format(parts);
  }

  static describe(value, { now = new Date() } = {}) {
    const parts = BirthDate._parts(value);
    if (!parts) return '';
    const day = `${parts.day} ${BirthDate.MONTHS[parts.month - 1]}`;
    const base = parts.year ? `born ${day} ${parts.year} (age ${BirthDate.age(value, now)})` : `birthday ${day}`;
    return `${base}${BirthDate._soon(BirthDate.daysUntil(value, now))}`;
  }

  static age(value, now = new Date()) {
    const parts = BirthDate._parts(value);
    if (!parts || !parts.year) return null;
    const hadBirthday = now.getMonth() + 1 > parts.month || (now.getMonth() + 1 === parts.month && now.getDate() >= parts.day);
    return now.getFullYear() - parts.year - (hadBirthday ? 0 : 1);
  }

  static daysUntil(value, now = new Date()) {
    const parts = BirthDate._parts(value);
    if (!parts) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let next = new Date(today.getFullYear(), parts.month - 1, parts.day);
    if (next < today) next = new Date(today.getFullYear() + 1, parts.month - 1, parts.day);
    return Math.round((next.getTime() - today.getTime()) / BirthDate.DAY_MS);
  }

  static _soon(days) {
    if (days === 0) return ', birthday today';
    return days != null && days <= BirthDate.SOON_DAYS ? `, birthday in ${days} day${days === 1 ? '' : 's'}` : '';
  }

  static _tidy(text) {
    return String(text == null ? '' : text).toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  }

  static _numeric(raw) {
    const full = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (full) return { year: Number(full[1]), month: Number(full[2]), day: Number(full[3]) };
    const short = raw.match(/^(?:--)?(\d{1,2})-(\d{1,2})$/);
    if (short) return { year: null, month: Number(short[1]), day: Number(short[2]) };
    const slashed = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    return slashed ? { year: slashed[3] ? Number(slashed[3]) : null, month: Number(slashed[1]), day: Number(slashed[2]) } : null;
  }

  static _named(raw) {
    const monthFirst = raw.match(/^([a-z]{3,}) (\d{1,2})(?: (\d{4}))?$/);
    const dayFirst = raw.match(/^(\d{1,2}) ([a-z]{3,})(?: (\d{4}))?$/);
    const found = monthFirst ? { name: monthFirst[1], day: monthFirst[2], year: monthFirst[3] } : (dayFirst ? { name: dayFirst[2], day: dayFirst[1], year: dayFirst[3] } : null);
    if (!found) return null;
    const month = BirthDate.MONTHS.findIndex((m) => m.toLowerCase().startsWith(found.name)) + 1;
    return month ? { year: found.year ? Number(found.year) : null, month, day: Number(found.day) } : null;
  }

  static _real({ year, month, day }, now) {
    if (month < 1 || month > 12 || day < 1) return false;
    if (year != null && (year < BirthDate.EARLIEST_YEAR || new Date(year, month - 1, day) > now)) return false;
    return day <= new Date(year == null ? 2000 : year, month, 0).getDate();
  }

  static _format({ year, month, day }) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${year == null ? '-' : year}-${pad(month)}-${pad(day)}`;
  }

  static _parts(value) {
    const stored = String(value || '').match(/^(\d{4}|-)-(\d{2})-(\d{2})$/);
    return stored ? { year: stored[1] === '-' ? null : Number(stored[1]), month: Number(stored[2]), day: Number(stored[3]) } : null;
  }
}

module.exports = BirthDate;
