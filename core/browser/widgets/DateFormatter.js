class DateFormatter {
  static ISO_PATTERN = /^\s*(\d{4})-(\d{1,2})(?:-(\d{1,2}))?(?:[T ](\d{1,2}):(\d{2}))?\s*$/;

  static TOKEN_HINT_PATTERN = /\b([YyAaJjMmDdTt]{1,4})([\/.\- ])([YyAaJjMmDdTt]{1,4})\2([YyAaJjMmDdTt]{1,4})\b/;

  static EXAMPLE_HINT_PATTERN = /\b(\d{1,4})([\/.\-])(\d{1,2})\2(\d{1,4})\b/;

  static MS_PER_DAY = 86400000;

  static parseIsoDate(iso) {
    const match = DateFormatter.ISO_PATTERN.exec(String(iso || ''));
    if (!match) return null;
    const parsed = DateFormatter._partsFromMatch(match);
    return DateFormatter._isRealDate(parsed) ? parsed : null;
  }

  static nativeDateValue(type, parsed) {
    const ymd = `${parsed.y}-${DateFormatter._pad2(parsed.m)}-${DateFormatter._pad2(parsed.d)}`;
    switch (type) {
      case 'date': return ymd;
      case 'datetime-local': return `${ymd}T${parsed.time || '00:00'}`;
      case 'month': return `${parsed.y}-${DateFormatter._pad2(parsed.m)}`;
      case 'week': return DateFormatter._isoWeek(parsed);
      default: return null;
    }
  }

  static formatFromHint(hint) {
    const text = String(hint || '');
    return DateFormatter._formatFromTokens(text) || DateFormatter._formatFromExample(text);
  }

  static detectDateFormat({ hints = [], currentValue = '', lang = '' } = {}) {
    for (const hint of hints) {
      const format = DateFormatter.formatFromHint(hint);
      if (format) return format;
    }
    const fromValue = DateFormatter.formatFromHint(currentValue);
    if (fromValue) return { ...fromValue, source: 'current-value' };
    return DateFormatter._formatForLocale(lang);
  }

  static formatDate(parsed, format) {
    return format.order.map((part) => DateFormatter._renderPart(parsed, format, part)).join(format.sep);
  }

  static describeFormat(format) {
    return format.order.map((part) => DateFormatter._describePart(format, part)).join(format.sep);
  }

  static digitsOf(text) {
    return String(text == null ? '' : text).replace(/\D/g, '');
  }

  static _partsFromMatch(match) {
    return {
      y: Number(match[1]),
      m: Number(match[2]),
      d: match[3] != null ? Number(match[3]) : 1,
      time: match[4] != null ? `${String(match[4]).padStart(2, '0')}:${match[5]}` : null,
      hasDay: match[3] != null,
    };
  }

  static _isRealDate({ y, m, d }) {
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const probe = new Date(Date.UTC(y, m - 1, d));
    return probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
  }

  static _isoWeek(parsed) {
    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((date - yearStart) / DateFormatter.MS_PER_DAY + 1) / 7);
    return `${date.getUTCFullYear()}-W${DateFormatter._pad2(week)}`;
  }

  static _formatFromTokens(text) {
    const match = DateFormatter.TOKEN_HINT_PATTERN.exec(text);
    if (!match) return null;
    const parts = [match[1], match[3], match[4]].map(DateFormatter._tokenPart);
    if (!parts.every(Boolean)) return null;
    const order = parts.map((part) => part.part);
    if (new Set(order).size !== 3) return null;
    const year = parts.find((part) => part.part === 'Y');
    const day = parts.find((part) => part.part === 'D');
    return { order, sep: match[2], yearLen: year.len, pad: day.len === 2, source: 'pattern' };
  }

  static _tokenPart(token) {
    const upper = token.toUpperCase();
    if (/^[YAJ]{4}$/.test(upper)) return { part: 'Y', len: 4 };
    if (/^[YA]{2}$/.test(upper)) return { part: 'Y', len: 2 };
    if (/^M{1,2}$/.test(upper)) return { part: 'M', len: upper.length };
    if (/^[DTJ]{1,2}$/.test(upper)) return { part: 'D', len: upper.length };
    return null;
  }

  static _formatFromExample(text) {
    const match = DateFormatter.EXAMPLE_HINT_PATTERN.exec(text);
    if (!match) return null;
    const [first, second, third] = [match[1], match[3], match[4]];
    const sep = match[2];
    const pad = ![first, second, third].some((part) => part.length === 1);
    if (first.length === 4) return { order: ['Y', 'M', 'D'], sep, yearLen: 4, pad: true, source: 'example' };
    const yearLen = third.length === 4 ? 4 : 2;
    if (Number(first) > 12) return { order: ['D', 'M', 'Y'], sep, yearLen, pad, source: 'example' };
    if (Number(second) > 12) return { order: ['M', 'D', 'Y'], sep, yearLen, pad, source: 'example' };
    return null;
  }

  static _formatForLocale(lang) {
    const locale = String(lang || '').toLowerCase();
    const format = (order, sep) => ({ order, sep, yearLen: 4, pad: true, source: 'locale' });
    if (DateFormatter._isMonthFirstLocale(locale)) return format(['M', 'D', 'Y'], '/');
    if (/^(ja|zh|ko|sv|lt|hu|fr-ca|en-ca)/.test(locale)) return format(['Y', 'M', 'D'], '-');
    if (/^(de|ru|pl|cs|sk|fi|nb|no|da|tr|uk|ro|et|lv|is)/.test(locale)) return format(['D', 'M', 'Y'], '.');
    if (/^nl/.test(locale)) return format(['D', 'M', 'Y'], '-');
    return format(['D', 'M', 'Y'], '/');
  }

  static _isMonthFirstLocale(locale) {
    return !locale || locale === 'en' || locale === 'en-us' || locale.startsWith('en-us')
      || locale === 'fil' || locale.startsWith('en-ph');
  }

  static _renderPart(parsed, format, part) {
    if (part === 'Y') return format.yearLen === 2 ? DateFormatter._pad2(parsed.y % 100) : String(parsed.y);
    const value = part === 'M' ? parsed.m : parsed.d;
    return format.pad ? DateFormatter._pad2(value) : String(value);
  }

  static _describePart(format, part) {
    if (part === 'Y') return 'Y'.repeat(format.yearLen);
    return format.pad ? part + part : part;
  }

  static _pad2(value) {
    return String(value).padStart(2, '0');
  }
}

module.exports = DateFormatter;
