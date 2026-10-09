const ColorMath = require('./ColorMath');

class BackgroundKeyer {
  static MAX_CLEARED_FRACTION = 0.95;
  static HALO_FACTOR = 1.3;
  static POCKET_FACTOR = 0.6;

  static key(rgba, w, h, options) {
    return new BackgroundKeyer(rgba, w, h, options).execute();
  }

  constructor(rgba, w, h, { tolerance = 90, localTolerance = 34, minBorderMatch = 0.6 } = {}) {
    this._rgba = rgba;
    this._w = w;
    this._h = h;
    this._tolerance = tolerance;
    this._tol2 = tolerance * tolerance;
    this._ltol2 = localTolerance * localTolerance;
    this._minBorderMatch = minBorderMatch;
  }

  execute() {
    if (!this._w || !this._h || this._w * this._h < 4) return null;
    this._border = this._borderIndexes();
    this._bg = this._dominantBorderColor();
    if (this._borderMatchFraction() < this._minBorderMatch) return null;
    this._cleared = this._floodFromBorder();
    if (this._cleared / (this._w * this._h) > BackgroundKeyer.MAX_CLEARED_FRACTION) return this._restoreAndRefuse();
    this._cleared += this._defringe();
    this._cleared += this._clearPockets();
    return { cleared: this._cleared, fraction: this._cleared / (this._w * this._h), bg: this._bg.map(Math.round) };
  }

  _idx(x, y) {
    return (y * this._w + x) * 4;
  }

  _rgbAt(i) {
    return [this._rgba[i], this._rgba[i + 1], this._rgba[i + 2]];
  }

  _borderIndexes() {
    const border = [];
    for (let x = 0; x < this._w; x++) border.push(this._idx(x, 0), this._idx(x, this._h - 1));
    for (let y = 1; y < this._h - 1; y++) border.push(this._idx(0, y), this._idx(this._w - 1, y));
    return border;
  }

  _dominantBorderColor() {
    const buckets = new Map();
    for (const i of this._border) {
      const key = `${this._rgba[i] >> 4},${this._rgba[i + 1] >> 4},${this._rgba[i + 2] >> 4}`;
      let bucket = buckets.get(key);
      if (!bucket) { bucket = [0, 0, 0, 0]; buckets.set(key, bucket); }
      bucket[0] += this._rgba[i]; bucket[1] += this._rgba[i + 1]; bucket[2] += this._rgba[i + 2]; bucket[3]++;
    }
    let best = null;
    for (const bucket of buckets.values()) if (!best || bucket[3] > best[3]) best = bucket;
    return [best[0] / best[3], best[1] / best[3], best[2] / best[3]];
  }

  _borderMatchFraction() {
    let match = 0;
    for (const i of this._border) if (this._nearBackground(i)) match++;
    return match / this._border.length;
  }

  _nearBackground(i) {
    return ColorMath.dist2(this._rgbAt(i), this._bg) <= this._tol2;
  }

  _floodFromBorder() {
    this._visited = new Uint8Array(this._w * this._h);
    const queue = this._seedQueue();
    let cleared = 0;
    for (let qi = 0; qi < queue.length; qi++) {
      const p = queue[qi];
      const current = this._rgbAt(p * 4);
      this._rgba[p * 4 + 3] = 0;
      cleared++;
      for (const np of this._neighbors(p)) {
        if (this._visited[np] || !this._joinsFill(np, current)) continue;
        this._visited[np] = 1;
        queue.push(np);
      }
    }
    return cleared;
  }

  _seedQueue() {
    const queue = [];
    for (const i of this._border) {
      const p = i / 4;
      if (this._visited[p] || !this._nearBackground(i)) continue;
      this._visited[p] = 1;
      queue.push(p);
    }
    return queue;
  }

  _joinsFill(np, current) {
    const color = this._rgbAt(np * 4);
    return ColorMath.dist2(color, this._bg) <= this._tol2 && ColorMath.dist2(color, current) <= this._ltol2;
  }

  _neighbors(p) {
    const x = p % this._w;
    const y = (p - x) / this._w;
    const out = [];
    if (x > 0) out.push(p - 1);
    if (x < this._w - 1) out.push(p + 1);
    if (y > 0) out.push(p - this._w);
    if (y < this._h - 1) out.push(p + this._w);
    return out;
  }

  _restoreAndRefuse() {
    for (let p = 0; p < this._w * this._h; p++) if (this._visited[p]) this._rgba[p * 4 + 3] = 255;
    return null;
  }

  _defringe() {
    const halo = this._tolerance * BackgroundKeyer.HALO_FACTOR;
    let cleared = 0;
    for (let p = 0; p < this._w * this._h; p++) {
      const i = p * 4;
      if (this._rgba[i + 3] === 0) continue;
      if (this._clearedNeighbors(p) >= 2 && ColorMath.dist2(this._rgbAt(i), this._bg) <= halo * halo) {
        this._rgba[i + 3] = 0;
        cleared++;
      }
    }
    return cleared;
  }

  _clearedNeighbors(p) {
    return this._neighbors(p).filter((np) => this._rgba[np * 4 + 3] === 0).length;
  }

  _clearPockets() {
    const pocket = this._tolerance * BackgroundKeyer.POCKET_FACTOR;
    let cleared = 0;
    for (let p = 0; p < this._w * this._h; p++) {
      const i = p * 4;
      if (this._rgba[i + 3] !== 0 && ColorMath.dist2(this._rgbAt(i), this._bg) <= pocket * pocket) {
        this._rgba[i + 3] = 0;
        cleared++;
      }
    }
    return cleared;
  }
}

module.exports = BackgroundKeyer;
