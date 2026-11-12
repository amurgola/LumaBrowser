class SnapshotExcerpt {
  static MAX_CHARS = 4000;
  static BEFORE = 4;
  static AFTER = 14;
  static MIN_NEEDLE = 4;
  static BODY_WORDS = 6;

  static needles(item) {
    const last = (item && item.lastNotification) || {};
    const opening = String(last.body || '').replace(/\s+/g, ' ').trim().split(' ').slice(0, SnapshotExcerpt.BODY_WORDS).join(' ');
    return [...new Set([item && item.title, ...((item && item.participants) || []), last.sender, opening]
      .map((n) => String(n || '').replace(/^#/, '').trim().toLowerCase())
      .filter((n) => n.length >= SnapshotExcerpt.MIN_NEEDLE))];
  }

  static around(text, needles, { maxChars = SnapshotExcerpt.MAX_CHARS } = {}) {
    const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
    const wanted = (needles || []).filter(Boolean);
    if (!wanted.length || !lines.length) return '';
    const keep = new Array(lines.length).fill(false);
    let hits = 0;
    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      if (!wanted.some((needle) => lower.includes(needle))) return;
      hits += 1;
      const from = Math.max(0, index - SnapshotExcerpt.BEFORE);
      const to = Math.min(lines.length - 1, index + SnapshotExcerpt.AFTER);
      for (let i = from; i <= to; i++) keep[i] = true;
    });
    if (!hits) return '';
    const out = [];
    let gap = false;
    lines.forEach((line, index) => {
      if (!keep[index]) { gap = out.length > 0; return; }
      if (!line.trim() && (!out.length || !out[out.length - 1].trim())) return;
      if (gap) out.push('[...]');
      gap = false;
      out.push(line);
    });
    return SnapshotExcerpt.tail(out.join('\n').trim(), maxChars);
  }

  static tail(text, maxChars = SnapshotExcerpt.MAX_CHARS) {
    const s = String(text || '').trim();
    if (s.length <= maxChars) return s;
    const cut = s.slice(s.length - maxChars);
    const firstBreak = cut.indexOf('\n');
    return `[...]\n${firstBreak >= 0 && firstBreak < 200 ? cut.slice(firstBreak + 1) : cut}`;
  }
}

module.exports = SnapshotExcerpt;
