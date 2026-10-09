const ColorMath = require('./ColorMath');

class PaletteQuantizer {
  static ITERATIONS = 5;

  static quantize(rgba, k = 24) {
    const opaque = PaletteQuantizer._opaqueIndexes(rgba);
    if (!opaque.length) return rgba;
    const points = opaque.map((i) => [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]]);
    const { centroids, assign } = PaletteQuantizer._cluster(points, Math.min(k, points.length));
    opaque.forEach((i, j) => PaletteQuantizer._paint(rgba, i, centroids[assign[j]]));
    return rgba;
  }

  static _opaqueIndexes(rgba) {
    const out = [];
    for (let i = 0; i < rgba.length / 4; i++) if (rgba[i * 4 + 3] >= 128) out.push(i);
    return out;
  }

  static _cluster(points, kk) {
    let centroids = PaletteQuantizer._seeds(points, kk);
    const assign = new Array(points.length);
    for (let it = 0; it < PaletteQuantizer.ITERATIONS; it++) {
      const sums = centroids.map(() => [0, 0, 0, 0]);
      points.forEach((p, i) => {
        assign[i] = PaletteQuantizer._nearest(p, centroids);
        const s = sums[assign[i]];
        s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
      });
      centroids = centroids.map((c, ci) => (sums[ci][3] ? sums[ci].slice(0, 3).map((v) => v / sums[ci][3]) : c));
    }
    return { centroids, assign };
  }

  static _seeds(points, kk) {
    const n = points.length;
    const sorted = points.slice().sort((a, b) => ColorMath.luminance(a[0], a[1], a[2]) - ColorMath.luminance(b[0], b[1], b[2]));
    const seeds = [];
    for (let i = 0; i < kk; i++) seeds.push(sorted[Math.floor((i * (n - 1)) / Math.max(1, kk - 1))].slice());
    return seeds;
  }

  static _nearest(p, centroids) {
    let best = 0;
    let bestDist = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const d = ColorMath.dist2(p, centroids[c]);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  }

  static _paint(rgba, i, color) {
    rgba[i * 4] = Math.round(color[0]);
    rgba[i * 4 + 1] = Math.round(color[1]);
    rgba[i * 4 + 2] = Math.round(color[2]);
  }
}

module.exports = PaletteQuantizer;
