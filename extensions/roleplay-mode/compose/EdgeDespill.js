class EdgeDespill {
  static RIM_MIN_BRIGHTNESS = 110;
  static RIM_MIN_SATURATION = 70;
  static RIM_PULL = 0.6;

  static apply(job, p, x, y) {
    if (!EdgeDespill._inEdgeBand(job, p, x, y)) return;
    const d = job.d;
    const i = p * 4;
    const mx = Math.max(d[i], d[i + 2]);
    if (d[i + 1] > mx) d[i + 1] = mx;
    EdgeDespill._desaturateRim(d, i);
  }

  static _inEdgeBand(job, p, x, y) {
    const { W, H, keyed } = job;
    const isEdge = (q) => (keyed[q + 1] || keyed[q - 1] || keyed[q + W] || keyed[q - W]);
    return isEdge(p) || (x + 2 < W && y + 2 < H && x - 2 >= 0 && y - 2 >= 0
      && (isEdge(p + 1) || isEdge(p - 1) || isEdge(p + W) || isEdge(p - W)));
  }

  static _desaturateRim(d, i) {
    const r = d[i]; const g = d[i + 1]; const b = d[i + 2];
    const hi = Math.max(r, g, b); const lo = Math.min(r, g, b);
    if (!(hi > EdgeDespill.RIM_MIN_BRIGHTNESS && hi - lo > EdgeDespill.RIM_MIN_SATURATION)) return;
    const lum = (r * 0.299 + g * 0.587 + b * 0.114);
    const k = EdgeDespill.RIM_PULL;
    d[i] = Math.round(r + (lum - r) * k);
    d[i + 1] = Math.round(g + (lum - g) * k);
    d[i + 2] = Math.round(b + (lum - b) * k);
  }
}

module.exports = EdgeDespill;
