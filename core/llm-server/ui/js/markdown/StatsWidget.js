import HtmlEscaper from '../format/HtmlEscaper.js';

export default class StatsWidget {
  static MAX = 4;

  static html(raw) {
    const tiles = StatsWidget.parse(raw);
    if (!tiles) return null;
    const esc = HtmlEscaper.escape;
    return '<div class="cm-widget cm-stats">' + tiles.map((t) => '<div class="cm-stat">'
      + '<div class="cm-stat-label">' + esc(t.label) + '</div>'
      + '<div class="cm-stat-value">' + esc(t.value) + '</div>'
      + (t.delta ? '<div class="cm-stat-delta' + (t.good === true ? ' good' : t.good === false ? ' bad' : '') + '">'
        + StatsWidget._arrow(t.delta) + esc(t.delta) + '</div>' : '')
      + '</div>').join('') + '</div>';
  }

  static parse(raw) {
    let j;
    try { j = JSON.parse(String(raw || '')); } catch (_) { return null; }
    const list = Array.isArray(j) ? j : (j && Array.isArray(j.stats) ? j.stats : null);
    if (!list) return null;
    const tiles = list.filter((t) => t && t.value != null && String(t.value).trim()).slice(0, StatsWidget.MAX).map((t) => ({
      label: String(t.label || '').slice(0, 60),
      value: String(t.value).slice(0, 24),
      delta: t.delta != null ? String(t.delta).slice(0, 40) : '',
      good: typeof t.good === 'boolean' ? t.good : null,
    }));
    return tiles.length ? tiles : null;
  }

  static _arrow(delta) {
    const s = String(delta).trim();
    if (/^[+▲↑]/.test(s)) return '<span class="cm-stat-arrow" aria-hidden="true">▲</span>';
    if (/^[-−▼↓]/.test(s)) return '<span class="cm-stat-arrow" aria-hidden="true">▼</span>';
    return '';
  }
}
