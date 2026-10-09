import HtmlEscaper from '../format/HtmlEscaper.js';

export default class ChartWidget {
  static W = 640;

  static H = 260;

  static PAD = { top: 16, right: 16, bottom: 34, left: 52 };

  static MAX_SERIES = 8;

  static MAX_POINTS = 60;

  static BAR_MAX = 24;

  static BAR_GAP = 2;

  static SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

  static color(i) {
    return 'var(--cm-series-' + (i + 1) + ', ' + ChartWidget.SERIES[i % ChartWidget.SERIES.length] + ')';
  }

  static html(raw) {
    const spec = ChartWidget.parse(raw);
    return spec ? ChartWidget._render(spec) : null;
  }

  static parse(raw) {
    let j;
    try { j = JSON.parse(String(raw || '')); } catch (_) { return null; }
    if (!j || typeof j !== 'object') return null;
    let series = Array.isArray(j.series) ? j.series : (Array.isArray(j.data) ? [{ name: j.title || '', data: j.data }] : null);
    if (!series || !series.length) return null;
    series = series.slice(0, ChartWidget.MAX_SERIES).map((s, i) => ({
      name: String((s && s.name) || 'Series ' + (i + 1)),
      data: (Array.isArray(s && s.data) ? s.data : []).slice(0, ChartWidget.MAX_POINTS).map(ChartWidget._num),
    }));
    const n = Math.max(...series.map((s) => s.data.length));
    if (!n || !series.some((s) => s.data.some((v) => v !== null))) return null;
    const labels = Array.from({ length: n }, (_, i) => String((Array.isArray(j.labels) && j.labels[i] != null) ? j.labels[i] : i + 1));
    return {
      type: j.type === 'line' ? 'line' : 'bar',
      title: j.title ? String(j.title) : '',
      unit: j.unit ? String(j.unit).slice(0, 8) : '',
      labels,
      series,
    };
  }

  static ticks(lo, hi) {
    const min = Math.min(0, lo);
    const max = Math.max(0, hi);
    const span = max - min || 1;
    const raw = span / 4;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    const out = [];
    for (let v = Math.floor(min / step) * step; v <= max + step * 0.001; v += step) out.push(+v.toFixed(10));
    if (out[out.length - 1] < max) out.push(+(out[out.length - 1] + step).toFixed(10));
    return out;
  }

  static format(v, unit) {
    const a = Math.abs(v);
    let s;
    if (a >= 1e9) s = +(v / 1e9).toFixed(1) + 'B';
    else if (a >= 1e6) s = +(v / 1e6).toFixed(1) + 'M';
    else if (a >= 1e4) s = +(v / 1e3).toFixed(1) + 'K';
    else s = (+v.toFixed(2)).toLocaleString('en-US');
    if (!unit) return s;
    return /^[$€£¥]$/.test(unit) ? (v < 0 ? '-' + unit + s.replace('-', '') : unit + s) : s + unit;
  }

  static _num(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }

  static _render(spec) {
    const esc = HtmlEscaper.escape;
    const values = spec.series.flatMap((s) => s.data).filter((v) => v !== null);
    const ticks = ChartWidget.ticks(Math.min(...values), Math.max(...values));
    const g = ChartWidget._geometry(spec, ticks);
    const plot = spec.type === 'line' ? ChartWidget._lines(spec, g) : ChartWidget._bars(spec, g);
    const label = (spec.title || 'Chart') + ': ' + spec.series.map((s) => s.name).join(', ');
    return '<figure class="cm-widget cm-chart">'
      + (spec.title ? '<figcaption class="cm-widget-title">' + esc(spec.title) + '</figcaption>' : '')
      + ChartWidget._legend(spec)
      + '<svg class="cm-chart-svg" viewBox="0 0 ' + ChartWidget.W + ' ' + ChartWidget.H + '" role="img" aria-label="' + esc(label) + '">'
      + ChartWidget._grid(spec, ticks, g) + plot + ChartWidget._xLabels(spec, g)
      + '</svg>'
      + ChartWidget._table(spec)
      + '</figure>';
  }

  static _geometry(spec, ticks) {
    const P = ChartWidget.PAD;
    const x0 = P.left;
    const x1 = ChartWidget.W - P.right;
    const y0 = ChartWidget.H - P.bottom;
    const y1 = P.top;
    const lo = ticks[0];
    const hi = ticks[ticks.length - 1];
    const y = (v) => y0 - ((v - lo) / (hi - lo || 1)) * (y0 - y1);
    const band = (x1 - x0) / spec.labels.length;
    return { x0, x1, y0, y1, y, band, cx: (i) => x0 + band * (i + 0.5) };
  }

  static _grid(spec, ticks, g) {
    return ticks.map((t) => {
      const yy = g.y(t).toFixed(1);
      return '<line class="cm-chart-grid' + (t === 0 ? ' zero' : '') + '" x1="' + g.x0 + '" x2="' + g.x1 + '" y1="' + yy + '" y2="' + yy + '"/>'
        + '<text class="cm-chart-tick" x="' + (g.x0 - 8) + '" y="' + yy + '" text-anchor="end" dominant-baseline="middle">'
        + HtmlEscaper.escape(ChartWidget.format(t, spec.unit)) + '</text>';
    }).join('');
  }

  static _xLabels(spec, g) {
    const every = Math.max(1, Math.ceil(spec.labels.length / Math.floor((g.x1 - g.x0) / 56)));
    return spec.labels.map((l, i) => (i % every ? '' : '<text class="cm-chart-tick" x="' + g.cx(i).toFixed(1) + '" y="' + (g.y0 + 20)
      + '" text-anchor="middle">' + HtmlEscaper.escape(l.length > 12 ? l.slice(0, 11) + '…' : l) + '</text>')).join('');
  }

  static _bars(spec, g) {
    const k = spec.series.length;
    const inner = g.band * 0.72;
    const w = Math.max(2, Math.min(ChartWidget.BAR_MAX, (inner - ChartWidget.BAR_GAP * (k - 1)) / k));
    const group = w * k + ChartWidget.BAR_GAP * (k - 1);
    const base = g.y(0);
    let out = '';
    spec.series.forEach((s, si) => {
      s.data.forEach((v, i) => {
        if (v === null) return;
        const x = g.cx(i) - group / 2 + si * (w + ChartWidget.BAR_GAP);
        const top = g.y(v);
        out += '<path class="cm-chart-mark" style="fill:' + ChartWidget.color(si) + '" d="'
          + ChartWidget._columnPath(x, w, base, top) + '"><title>' + HtmlEscaper.escape(ChartWidget._tip(spec, s, i, v)) + '</title></path>';
      });
    });
    return out;
  }

  static _columnPath(x, w, base, end) {
    const r = Math.min(4, w / 2, Math.abs(base - end));
    const k = end <= base ? r : -r;
    const f = (n) => n.toFixed(1);
    return 'M' + f(x) + ' ' + f(base) + 'V' + f(end + k) + 'Q' + f(x) + ' ' + f(end) + ' ' + f(x + r) + ' ' + f(end)
      + 'H' + f(x + w - r) + 'Q' + f(x + w) + ' ' + f(end) + ' ' + f(x + w) + ' ' + f(end + k) + 'V' + f(base) + 'Z';
  }

  static _lines(spec, g) {
    let out = '';
    spec.series.forEach((s, si) => {
      const color = ChartWidget.color(si);
      const pts = s.data.map((v, i) => (v === null ? null : [g.cx(i), g.y(v)]));
      let d = '';
      let pen = false;
      pts.forEach((p) => {
        if (!p) { pen = false; return; }
        d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
        pen = true;
      });
      out += '<path class="cm-chart-line" style="stroke:' + color + '" d="' + d + '"/>';
      pts.forEach((p, i) => {
        if (!p) return;
        out += '<circle class="cm-chart-dot" style="fill:' + color + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4">'
          + '<title>' + HtmlEscaper.escape(ChartWidget._tip(spec, s, i, s.data[i])) + '</title></circle>';
      });
    });
    return out;
  }

  static _tip(spec, s, i, v) {
    return (spec.series.length > 1 ? s.name + ' · ' : '') + spec.labels[i] + ': ' + ChartWidget.format(v, spec.unit);
  }

  static _legend(spec) {
    if (spec.series.length < 2) return '';
    return '<div class="cm-chart-legend">' + spec.series.map((s, i) => '<span class="cm-chart-key"><span class="cm-chart-swatch' + (spec.type === 'line' ? ' line' : '')
      + '" style="background:' + ChartWidget.color(i) + '"></span>' + HtmlEscaper.escape(s.name) + '</span>').join('') + '</div>';
  }

  static _table(spec) {
    const esc = HtmlEscaper.escape;
    const head = '<tr><th></th>' + spec.series.map((s) => '<th>' + esc(s.name) + '</th>').join('') + '</tr>';
    const rows = spec.labels.map((l, i) => '<tr><td>' + esc(l) + '</td>'
      + spec.series.map((s) => '<td>' + (s.data[i] === null || s.data[i] === undefined ? '' : esc(ChartWidget.format(s.data[i], spec.unit))) + '</td>').join('') + '</tr>').join('');
    return '<details class="cm-chart-data"><summary>Show data</summary><table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></details>';
  }
}
