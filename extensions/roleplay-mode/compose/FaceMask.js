const CanvasLib = require('./CanvasLib');

class FaceMask {
  static FEATHER = 26;
  static INNER_FACE = { x: 0.30, y: 0.30, w: 0.40, h: 0.34 };

  static build(W, H, rect, feather = FaceMask.FEATHER) {
    const c = CanvasLib.create(W, H);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    const f = FaceMask.INNER_FACE;
    const r = rect || { x: W * f.x, y: H * f.y, w: W * f.w, h: H * f.h };
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = feather;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return CanvasLib.toB64(c);
  }
}

module.exports = FaceMask;
