const fs = require('fs');
const path = require('path');
const FrameStats = require('./FrameStats');

class SmokeFrameCapture {
  static RECT_TIMEOUT_MS = 2000;
  static KEEP_PNGS = 2;

  constructor({ win, shotDir = null, sleep }) {
    this._win = win;
    this._shotDir = shotDir;
    this._sleep = sleep;
    this._lastFrame = null;
    this.shots = [];
  }

  attach() {
    this._win.webContents.on('paint', (_e, _dirty, image) => { this._lastFrame = image; });
    try { this._win.webContents.setFrameRate(30); } catch (_) {}
  }

  async snap(label, atMs) {
    const img = await this._frame();
    if (!img || img.isEmpty()) {
      this.shots.push({ label, at: atMs, stats: null, png: null });
      return;
    }
    const { width, height } = img.getSize();
    const rect = await this._canvasRect();
    const stats = SmokeFrameCapture._stats(img, width, height, SmokeFrameCapture._region(rect));
    const png = SmokeFrameCapture._png(img);
    const file = this._save(png, label);
    this.shots.push({ label, at: atMs, stats, canvasRect: rect, png, file, size: { width, height } });
    for (let i = 0; i < this.shots.length - SmokeFrameCapture.KEEP_PNGS; i++) this.shots[i].png = null;
  }

  async _frame() {
    if (this._lastFrame) return this._lastFrame;
    try { return await this._win.webContents.capturePage(); } catch (_) { return null; }
  }

  async _canvasRect() {
    try {
      const raw = await Promise.race([
        this._win.webContents.executeJavaScript('window.__lumaSmokeCanvasRect ? window.__lumaSmokeCanvasRect() : "null"', true),
        this._sleep(SmokeFrameCapture.RECT_TIMEOUT_MS).then(() => 'null'),
      ]);
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  static _region(rect) {
    if (!rect || !(rect.w > 0) || !(rect.h > 0)) return null;
    const dpr = rect.dpr || 1;
    return { x: rect.x * dpr, y: rect.y * dpr, w: rect.w * dpr, h: rect.h * dpr };
  }

  static _stats(img, width, height, region) {
    try { return FrameStats.measure(img.toBitmap(), width, height, region); } catch (_) { return null; }
  }

  static _png(img) {
    try { return img.toPNG(); } catch (_) { return null; }
  }

  _save(png, label) {
    if (!png || !this._shotDir) return null;
    try {
      fs.mkdirSync(this._shotDir, { recursive: true });
      const file = path.join(this._shotDir, `${label}.png`);
      fs.writeFileSync(file, png);
      return file;
    } catch (_) { return null; }
  }
}

module.exports = SmokeFrameCapture;
