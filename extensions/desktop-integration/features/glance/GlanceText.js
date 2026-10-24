class GlanceText {
  static ELLIPSIS = '...';
  static MIN_TITLE = 6;

  static clock(date, format = '12h') {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    if (format === '24h') return `${String(h).padStart(2, '0')}:${m}`;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m}${h < 12 ? 'am' : 'pm'}`;
  }

  static duration(minutes) {
    const total = Math.max(0, Math.round(minutes));
    if (total < 60) return `${total}m`;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  static startOfDay(date) {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  static dayWord(date, now) {
    const days = Math.round((GlanceText.startOfDay(date) - GlanceText.startOfDay(now)) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  }

  static oneLine(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  }

  static clip(text, max) {
    const s = GlanceText.oneLine(text);
    if (!(max > 0) || s.length <= max) return s;
    if (max <= GlanceText.ELLIPSIS.length) return s.slice(0, max);
    return s.slice(0, max - GlanceText.ELLIPSIS.length).trimEnd() + GlanceText.ELLIPSIS;
  }

  static render(segment) {
    return `${segment.pre || ''}${segment.title || ''}${segment.post || ''}`;
  }

  static fit(segments, separator, max) {
    const list = segments.filter((s) => s && GlanceText.render(s)).map((s) => ({ pre: s.pre || '', title: GlanceText.oneLine(s.title), post: s.post || '' }));
    const join = () => list.map(GlanceText.render).join(separator);
    if (!(max > 0)) return join();
    let over = join().length - max;
    while (over > 0) {
      const longest = list.reduce((best, s) => (s.title.length > (best ? best.title.length : 0) ? s : best), null);
      if (!longest || longest.title.length <= GlanceText.MIN_TITLE) break;
      const target = Math.max(GlanceText.MIN_TITLE, longest.title.length - over);
      longest.title = GlanceText.clip(longest.title, target);
      over = join().length - max;
    }
    return GlanceText.clip(join(), max);
  }
}

module.exports = GlanceText;
