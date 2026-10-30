export default class RegionOverlay {
  static RING = 'rgba(255, 255, 255, 0.95)';
  static RING_EDGE = 'rgba(0, 0, 0, 0.55)';
  static BOX = 'rgba(255, 255, 255, 0.9)';
  static BOX_EDGE = 'rgba(0, 0, 0, 0.5)';
  static BOX_DASH = [6, 4];
  static RECT_FILL = 'rgba(245, 144, 52, 0.35)';
  static RECT_LINE = 'rgba(255, 255, 255, 0.9)';
  static TINY_RADIUS = 5;

  constructor({ canvas }) {
    this._canvas = canvas;
    this._ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    this._dpr = 1;
    this._width = 0;
    this._height = 0;
  }

  resize(width, height) {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    this._dpr = dpr;
    this._width = Math.max(0, width);
    this._height = Math.max(0, height);
    this._canvas.width = Math.max(1, Math.round(this._width * dpr));
    this._canvas.height = Math.max(1, Math.round(this._height * dpr));
  }

  draw({ cursor = null, rect = null, context = null } = {}) {
    const ctx = this._ctx;
    if (!ctx) return;
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, this._width, this._height);
    if (context) this._box(ctx, context);
    if (rect) this._rect(ctx, rect);
    if (cursor) this._ring(ctx, cursor);
  }

  _box(ctx, r) {
    ctx.save();
    ctx.setLineDash(RegionOverlay.BOX_DASH);
    ctx.lineWidth = 3;
    ctx.strokeStyle = RegionOverlay.BOX_EDGE;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.width - 1, r.height - 1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = RegionOverlay.BOX;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.width - 1, r.height - 1);
    ctx.restore();
  }

  _rect(ctx, r) {
    const x = Math.min(r.x, r.x + r.width);
    const y = Math.min(r.y, r.y + r.height);
    const w = Math.abs(r.width);
    const h = Math.abs(r.height);
    ctx.save();
    ctx.fillStyle = RegionOverlay.RECT_FILL;
    ctx.fillRect(x, y, w, h);
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = RegionOverlay.RECT_LINE;
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
    ctx.restore();
  }

  _ring(ctx, c) {
    const r = Math.max(1, c.radius);
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = RegionOverlay.RING_EDGE;
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = RegionOverlay.RING;
    if (c.eraser) ctx.setLineDash([4, 3]);
    ctx.stroke();
    if (r <= RegionOverlay.TINY_RADIUS) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(c.x - 8, c.y); ctx.lineTo(c.x + 8, c.y);
      ctx.moveTo(c.x, c.y - 8); ctx.lineTo(c.x, c.y + 8);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
}
