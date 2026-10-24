class TaskbarIcons {
  static SIZE = 16;
  static SAMPLES = 4;
  static RUNNING = [0x3b, 0x82, 0xf6];
  static FAILED = [0xef, 0x44, 0x44];
  static WHITE = [0xff, 0xff, 0xff];

  constructor(nativeImage) {
    this._nativeImage = nativeImage;
    this._cache = new Map();
  }

  get(name) {
    if (!this._nativeImage || typeof this._nativeImage.createFromBitmap !== 'function') return null;
    if (!this._cache.has(name)) {
      const buffer = TaskbarIcons.bitmap(name);
      this._cache.set(name, buffer ? this._nativeImage.createFromBitmap(buffer, { width: TaskbarIcons.SIZE, height: TaskbarIcons.SIZE, scaleFactor: 1 }) : null);
    }
    return this._cache.get(name);
  }

  static bitmap(name) {
    const shapes = {
      running: { color: TaskbarIcons.RUNNING, inside: TaskbarIcons._dot },
      failed: { color: TaskbarIcons.FAILED, inside: TaskbarIcons._dot },
      stop: { color: TaskbarIcons.WHITE, inside: TaskbarIcons._square },
      cancel: { color: TaskbarIcons.WHITE, inside: TaskbarIcons._cross },
    };
    const shape = shapes[name];
    if (!shape) return null;
    const n = TaskbarIcons.SIZE;
    const s = TaskbarIcons.SAMPLES;
    const buf = Buffer.alloc(n * n * 4);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let hits = 0;
        for (let sy = 0; sy < s; sy++) {
          for (let sx = 0; sx < s; sx++) {
            if (shape.inside(x + (sx + 0.5) / s, y + (sy + 0.5) / s, n)) hits++;
          }
        }
        const a = Math.round((hits / (s * s)) * 255);
        const i = (y * n + x) * 4;
        buf[i] = Math.round((shape.color[2] * a) / 255);
        buf[i + 1] = Math.round((shape.color[1] * a) / 255);
        buf[i + 2] = Math.round((shape.color[0] * a) / 255);
        buf[i + 3] = a;
      }
    }
    return buf;
  }

  static _dot(x, y, n) {
    const c = n / 2;
    return (x - c) ** 2 + (y - c) ** 2 <= (n / 2 - 1) ** 2;
  }

  static _square(x, y, n) {
    return x >= n * 0.25 && x <= n * 0.75 && y >= n * 0.25 && y <= n * 0.75;
  }

  static _cross(x, y, n) {
    const lo = n * 0.22;
    const hi = n * 0.78;
    if (x < lo || x > hi || y < lo || y > hi) return false;
    const half = 1.1;
    return Math.abs(x - y) <= half || Math.abs(x + y - n) <= half;
  }
}

module.exports = TaskbarIcons;
