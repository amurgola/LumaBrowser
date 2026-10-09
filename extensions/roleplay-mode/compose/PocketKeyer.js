class PocketKeyer {
  static GLOBAL_THR_FACTOR = 0.45;
  static POCKET_MAX_FRACTION = 0.06;
  static MIN_POCKET_CAP = 64;
  static SHADED_TOLERANCE = 0.35;

  static key(job, opts = {}) {
    const isNearBg = PocketKeyer._nearBgTest(job, opts);
    const pocketMaxFrac = Number.isFinite(opts.pocketMaxFrac) ? opts.pocketMaxFrac : PocketKeyer.POCKET_MAX_FRACTION;
    const sizeCap = Math.max(PocketKeyer.MIN_POCKET_CAP, Math.round(PocketKeyer._foreground(job.keyed) * pocketMaxFrac));
    const seen = new Uint8Array(job.W * job.H);
    for (let start = 0; start < job.keyed.length; start += 1) {
      if (job.keyed[start] || seen[start] || !isNearBg(start)) continue;
      const comp = PocketKeyer._component(job, start, seen, isNearBg);
      if (comp.length <= sizeCap) for (let k = 0; k < comp.length; k += 1) job.keyed[comp[k]] = 1;
    }
  }

  static _foreground(keyed) {
    let n = 0;
    for (let p = 0; p < keyed.length; p += 1) if (!keyed[p]) n += 1;
    return n;
  }

  static _nearBgTest(job, opts) {
    const { d, bg, bgGreenDom, greenDomMargin } = job;
    const gThr = Number.isFinite(opts.globalThr) ? opts.globalThr : job.thr * PocketKeyer.GLOBAL_THR_FACTOR;
    const gThr2 = gThr * gThr;
    const bgLum = (bg.r * 0.299 + bg.g * 0.587 + bg.b * 0.114) || 1;
    const bgN = [bg.r / bgLum, bg.g / bgLum, bg.b / bgLum];
    return (p) => {
      const i = p * 4;
      const r = d[i]; const g = d[i + 1]; const b = d[i + 2];
      if (bgGreenDom && !(g > Math.max(r, b) + greenDomMargin)) return false;
      const dr = r - bg.r; const dg = g - bg.g; const db = b - bg.b;
      if (dr * dr + dg * dg + db * db <= gThr2) return true;
      if (!bgGreenDom) return false;
      if (!(g > r * 1.25 + 8 && g > b * 1.25 + 8)) return false;
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) || 1;
      const dn = Math.abs(r / lum - bgN[0]) + Math.abs(g / lum - bgN[1]) + Math.abs(b / lum - bgN[2]);
      return dn <= PocketKeyer.SHADED_TOLERANCE;
    };
  }

  static _component(job, start, seen, isNearBg) {
    const { W, H, keyed } = job;
    const comp = [];
    const queue = [start];
    seen[start] = 1;
    const visit = (q) => { if (!seen[q] && !keyed[q] && isNearBg(q)) { seen[q] = 1; queue.push(q); } };
    for (let qi = 0; qi < queue.length; qi += 1) {
      const p = queue[qi];
      comp.push(p);
      const x = p % W; const y = (p - x) / W;
      if (x + 1 < W) visit(p + 1);
      if (x - 1 >= 0) visit(p - 1);
      if (y + 1 < H) visit(p + W);
      if (y - 1 >= 0) visit(p - W);
    }
    return comp;
  }
}

module.exports = PocketKeyer;
