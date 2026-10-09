class QuietHours {
  static MAX_DEFERRED = 50;
  static RANGE_TEXT = /^(\d{1,2}:\d{2})\s*[-–to]+\s*(\d{1,2}:\d{2})$/i;
  static TIME_TEXT = /^(\d{1,2}):(\d{2})$/;

  static normalize(config) {
    const cfg = QuietHours._asObject(config);
    if (!cfg) return null;
    const start = QuietHours._parseHHMM(cfg.start);
    const end = QuietHours._parseHHMM(cfg.end);
    if (start === null || end === null || start === end) return null;
    const out = { start: QuietHours._formatHHMM(start), end: QuietHours._formatHHMM(end), mode: cfg.mode === 'skip' ? 'skip' : 'defer' };
    const days = QuietHours._normalizeDays(cfg.days);
    if (days) out.days = days;
    return out;
  }

  static check(config, now = new Date()) {
    const q = QuietHours.normalize(config);
    if (!q) return QuietHours._notQuiet();
    const start = QuietHours._parseHHMM(q.start);
    const end = QuietHours._parseHHMM(q.end);
    const window = QuietHours._windowAt(start, end, now);
    if (!window.inside || (q.days && !q.days.includes(window.startDay))) return QuietHours._notQuiet();
    return { quiet: true, resumesAt: QuietHours._resumeTime(end, now) };
  }

  static _parseHHMM(text) {
    const m = String(text || '').trim().match(QuietHours.TIME_TEXT);
    if (!m) return null;
    const hours = Number(m[1]);
    const minutes = Number(m[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  static _asObject(config) {
    if (!config) return null;
    if (typeof config === 'string') {
      const m = config.trim().match(QuietHours.RANGE_TEXT);
      return m ? { start: m[1], end: m[2] } : null;
    }
    return typeof config === 'object' ? config : null;
  }

  static _normalizeDays(days) {
    if (!Array.isArray(days)) return null;
    const valid = days.map((d) => parseInt(d, 10)).filter((d) => Number.isFinite(d) && d >= 0 && d <= 6);
    const unique = [...new Set(valid)].sort();
    return unique.length && unique.length < 7 ? unique : null;
  }

  static _windowAt(start, end, now) {
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (start < end) return { inside: minutes >= start && minutes < end, startDay: now.getDay() };
    const startedYesterday = minutes < start;
    return {
      inside: minutes >= start || minutes < end,
      startDay: startedYesterday ? (now.getDay() + 6) % 7 : now.getDay(),
    };
  }

  static _resumeTime(end, now) {
    const resumesAt = new Date(now);
    resumesAt.setHours(Math.floor(end / 60), end % 60, 0, 0);
    if (resumesAt <= now) resumesAt.setDate(resumesAt.getDate() + 1);
    return resumesAt;
  }

  static _formatHHMM(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  static _notQuiet() {
    return { quiet: false, resumesAt: null };
  }
}

module.exports = QuietHours;
