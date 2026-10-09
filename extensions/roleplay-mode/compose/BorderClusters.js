class BorderClusters {
  static MERGE_DISTANCE = 40;
  static MIN_FRACTION = 0.06;
  static MAX_CLUSTERS = 3;

  static find(d, W, H) {
    const merged = BorderClusters._merge(BorderClusters._buckets(d, W, H));
    return merged.filter((c) => c.frac >= BorderClusters.MIN_FRACTION && BorderClusters._multiEdge(c.edges))
      .slice(0, BorderClusters.MAX_CLUSTERS);
  }

  static isGreenDominant(r, g, b) {
    return g > r * 1.25 + 8 && g > b * 1.25 + 8;
  }

  static _buckets(d, W, H) {
    const counts = new Map();
    const addPx = (p, edge) => {
      const i = p * 4;
      const key = ((d[i] >> 5) << 10) | ((d[i + 1] >> 5) << 5) | (d[i + 2] >> 5);
      let c = counts.get(key);
      if (!c) { c = { n: 0, r: 0, g: 0, b: 0, edges: 0 }; counts.set(key, c); }
      c.n += 1; c.r += d[i]; c.g += d[i + 1]; c.b += d[i + 2];
      c.edges |= 1 << edge;
    };
    for (let x = 0; x < W; x += 1) { addPx(x, 0); addPx((H - 1) * W + x, 1); }
    for (let y = 1; y < H - 1; y += 1) { addPx(y * W, 2); addPx(y * W + W - 1, 3); }
    const ring = 2 * W + 2 * (H - 2);
    return Array.from(counts.values())
      .map((c) => ({ r: c.r / c.n, g: c.g / c.n, b: c.b / c.n, frac: c.n / ring, edges: c.edges }))
      .sort((a, b) => b.frac - a.frac);
  }

  static _merge(raw) {
    const out = [];
    const limit = BorderClusters.MERGE_DISTANCE * BorderClusters.MERGE_DISTANCE;
    for (const c of raw) {
      const near = out.find((o) => {
        const dr = o.r - c.r; const dg = o.g - c.g; const db = o.b - c.b;
        return dr * dr + dg * dg + db * db < limit;
      });
      if (near) BorderClusters._absorb(near, c);
      else out.push({ r: c.r, g: c.g, b: c.b, frac: c.frac, edges: c.edges });
    }
    return out;
  }

  static _absorb(near, c) {
    const n = near.frac + c.frac;
    near.r = (near.r * near.frac + c.r * c.frac) / n;
    near.g = (near.g * near.frac + c.g * c.frac) / n;
    near.b = (near.b * near.frac + c.b * c.frac) / n;
    near.frac = n;
    near.edges |= c.edges;
  }

  static _multiEdge(e) {
    return (e & (e - 1)) !== 0;
  }
}

module.exports = BorderClusters;
