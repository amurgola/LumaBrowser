const CanvasLib = require('./CanvasLib');
const BorderClusters = require('./BorderClusters');
const PocketKeyer = require('./PocketKeyer');
const EdgeDespill = require('./EdgeDespill');

class FigureKeyer {
  static DEFAULT_THRESHOLD = 50;
  static DEFAULT_ERODE = 3;
  static DEFAULT_GREEN_MARGIN = 12;

  static async key(b64, opts = {}) {
    const canvas = await CanvasLib.fromB64(b64);
    const W = canvas.width;
    const H = canvas.height;
    const ctx = canvas.getContext('2d');
    const id = ctx.getImageData(0, 0, W, H);
    const job = FigureKeyer._job(id.data, W, H, opts);
    FigureKeyer._floodFromBorder(job);
    FigureKeyer._erode(job, Number.isFinite(opts.erode) ? opts.erode : FigureKeyer.DEFAULT_ERODE);
    if (opts.globalKey && job.bgGreenDom) PocketKeyer.key(job, opts);
    const bbox = FigureKeyer._applyAlpha(job, !!opts.despill);
    ctx.putImageData(id, 0, 0);
    return { canvas, bbox, keyed: job.keyed, W, H };
  }

  static _job(d, W, H, opts) {
    const clusters = BorderClusters.find(d, W, H);
    if (!clusters.length) clusters.push({ r: d[0], g: d[1], b: d[2], frac: 1 });
    const bg = clusters[0];
    const thr = Number.isFinite(opts.thr) ? opts.thr : FigureKeyer.DEFAULT_THRESHOLD;
    return {
      d, W, H, clusters, bg, thr,
      thr2: thr * thr,
      keyed: new Uint8Array(W * H),
      bgGreenDom: BorderClusters.isGreenDominant(bg.r, bg.g, bg.b),
      greenDomMargin: Number.isFinite(opts.greenDomMargin) ? opts.greenDomMargin : FigureKeyer.DEFAULT_GREEN_MARGIN,
    };
  }

  static _floodFromBorder(job) {
    const { d, W, H, keyed } = job;
    const stack = [];
    for (let x = 0; x < W; x += 1) { stack.push(x); stack.push((H - 1) * W + x); }
    for (let y = 0; y < H; y += 1) { stack.push(y * W); stack.push(y * W + W - 1); }
    while (stack.length) {
      const p = stack.pop();
      if (p < 0 || p >= keyed.length || keyed[p]) continue;
      const i = p * 4;
      if (!FigureKeyer._nearAnyCluster(job, i)) continue;
      if (job.bgGreenDom && !(d[i + 1] > Math.max(d[i], d[i + 2]) + job.greenDomMargin)) continue;
      keyed[p] = 1;
      FigureKeyer._pushNeighbours(stack, p, W, H);
    }
  }

  static _nearAnyCluster(job, i) {
    const { d, clusters, thr2 } = job;
    for (let k = 0; k < clusters.length; k += 1) {
      const c = clusters[k];
      const dr = d[i] - c.r; const dg = d[i + 1] - c.g; const db = d[i + 2] - c.b;
      if (dr * dr + dg * dg + db * db <= thr2) return true;
    }
    return false;
  }

  static _pushNeighbours(stack, p, W, H) {
    const x = p % W; const y = (p - x) / W;
    if (x + 1 < W) stack.push(p + 1);
    if (x - 1 >= 0) stack.push(p - 1);
    if (y + 1 < H) stack.push(p + W);
    if (y - 1 >= 0) stack.push(p - W);
  }

  static _erode(job, passes) {
    const { W, H, keyed } = job;
    for (let e = 0; e < passes; e += 1) {
      const toKey = [];
      for (let p = 0; p < keyed.length; p += 1) {
        if (keyed[p]) continue;
        const x = p % W; const y = (p - x) / W;
        if ((x + 1 < W && keyed[p + 1]) || (x - 1 >= 0 && keyed[p - 1])
          || (y + 1 < H && keyed[p + W]) || (y - 1 >= 0 && keyed[p - W])) toKey.push(p);
      }
      for (let k = 0; k < toKey.length; k += 1) keyed[toKey[k]] = 1;
    }
  }

  static _applyAlpha(job, despill) {
    const { d, W, H, keyed } = job;
    let minX = W; let minY = H; let maxX = 0; let maxY = 0; let any = false;
    for (let p = 0; p < keyed.length; p += 1) {
      if (keyed[p]) { d[p * 4 + 3] = 0; continue; }
      const x = p % W; const y = (p - x) / W;
      if (despill) EdgeDespill.apply(job, p, x, y);
      any = true;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    return any ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : { x: 0, y: 0, w: W, h: H };
  }
}

module.exports = FigureKeyer;
