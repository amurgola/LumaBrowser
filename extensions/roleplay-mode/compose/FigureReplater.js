const CanvasLib = require('./CanvasLib');
const FigureKeyer = require('./FigureKeyer');
const ComponentFilter = require('./ComponentFilter');

class FigureReplater {
  static CHROMA = [0, 177, 64];
  static KEY_THRESHOLD = 95;
  static ERODE = 2;
  static MIN_FOREGROUND = 0.05;

  static async replate(b64, opts = {}) {
    const keyed = await FigureKeyer.key(b64, {
      thr: Number.isFinite(opts.thr) ? opts.thr : FigureReplater.KEY_THRESHOLD,
      erode: Number.isFinite(opts.erode) ? opts.erode : FigureReplater.ERODE,
      globalKey: opts.globalKey !== false,
      despill: opts.despill !== false,
    });
    if (FigureReplater._foreground(keyed) < keyed.W * keyed.H * FigureReplater.MIN_FOREGROUND) return b64;
    if (opts.keepLargest !== false) FigureReplater._dropSecondaryCopies(keyed);
    return FigureReplater._onPlate(keyed, Array.isArray(opts.rgb) ? opts.rgb : FigureReplater.CHROMA);
  }

  static async tryReplate(b64, opts) {
    try { return await FigureReplater.replate(b64, opts); } catch (_) { return null; }
  }

  static _foreground(keyed) {
    let fg = 0;
    for (let p = 0; p < keyed.keyed.length; p += 1) if (!keyed.keyed[p]) fg += 1;
    return fg;
  }

  static _dropSecondaryCopies(keyed) {
    if (ComponentFilter.keepLargest(keyed) <= 0) return;
    const ctx = keyed.canvas.getContext('2d');
    const id = ctx.getImageData(0, 0, keyed.W, keyed.H);
    for (let p = 0; p < keyed.keyed.length; p += 1) {
      if (keyed.keyed[p]) id.data[p * 4 + 3] = 0;
    }
    ctx.putImageData(id, 0, 0);
  }

  static _onPlate(keyed, rgb) {
    const out = CanvasLib.create(keyed.W, keyed.H);
    const ctx = out.getContext('2d');
    ctx.fillStyle = CanvasLib.rgb(rgb);
    ctx.fillRect(0, 0, keyed.W, keyed.H);
    ctx.drawImage(keyed.canvas, 0, 0);
    return CanvasLib.toB64(out);
  }
}

module.exports = FigureReplater;
