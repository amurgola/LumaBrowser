const FigureKeyer = require('./FigureKeyer');

class FigureShapeProbe {
  static CLOSE_UP_FRACTION = 0.55;
  static TINY_FRACTION = 0.10;
  static OFFSIDE_DISTANCE = 0.28;
  static KEY_THRESHOLD = 95;

  static async probe(b64, opts = {}) {
    const keyed = await FigureKeyer.key(b64, {
      thr: Number.isFinite(opts.thr) ? opts.thr : FigureShapeProbe.KEY_THRESHOLD,
      erode: 0,
      globalKey: true,
      despill: false,
    });
    const { fgFrac, cxFrac } = FigureShapeProbe._measure(keyed);
    const closeUp = fgFrac > FigureShapeProbe.CLOSE_UP_FRACTION;
    const tiny = fgFrac < FigureShapeProbe.TINY_FRACTION;
    const offside = !tiny && !closeUp && Math.abs(cxFrac - 0.5) > FigureShapeProbe.OFFSIDE_DISTANCE;
    return { fgFrac, cxFrac, closeUp, tiny, offside, ok: !closeUp && !tiny && !offside };
  }

  static async tryProbe(b64) {
    try { return await FigureShapeProbe.probe(b64); } catch (_) { return null; }
  }

  static _measure({ keyed, W, H }) {
    let fg = 0;
    let sx = 0;
    for (let p = 0; p < keyed.length; p += 1) {
      if (!keyed[p]) { fg += 1; sx += p % W; }
    }
    return { fgFrac: fg / (W * H), cxFrac: fg ? (sx / fg) / W : 0.5 };
  }
}

module.exports = FigureShapeProbe;
