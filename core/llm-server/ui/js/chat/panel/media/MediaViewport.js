import RegionViewport from '../../region/RegionViewport.js';

export default class MediaViewport extends RegionViewport {
  static MAX_PIXEL_SCALE = 8;
  static STEP = 1.25;

  static FIT_MARGIN = 16;

  fitScale() {
    const { width, height } = this.viewportSize();
    const m = MediaViewport.FIT_MARGIN * 2;
    const w = width > m * 2 ? width - m : width;
    const h = height > m * 2 ? height - m : height;
    return Math.min(w / this._width, h / this._height, 1);
  }

  maxZoom() {
    return Math.max(RegionViewport.MAX_ZOOM, MediaViewport.MAX_PIXEL_SCALE / this.fitScale());
  }

  oneToOneZoom() {
    return 1 / this.fitScale();
  }

  percent() {
    return Math.round(this.scale * 100);
  }

  isFit() {
    return this.zoom <= RegionViewport.MIN_ZOOM + 1e-6;
  }

  oneToOne(vx, vy) {
    const c = this._centre(vx, vy);
    return this.zoomTo(this.oneToOneZoom(), c.x, c.y);
  }

  toggle(vx, vy) {
    if (!this.isFit()) { this.fit(); return true; }
    const target = this.oneToOneZoom() > 1.05 ? this.oneToOneZoom() : 2;
    const c = this._centre(vx, vy);
    return this.zoomTo(target, c.x, c.y);
  }

  step(dir) {
    const c = this._centre();
    return this.zoomAt(dir > 0 ? MediaViewport.STEP : 1 / MediaViewport.STEP, c.x, c.y);
  }

  zoomTo(zoom, vx, vy) {
    return this.zoomAt(zoom / this.zoom, vx, vy);
  }

  setSize(width, height) {
    this._width = width || 1;
    this._height = height || 1;
    this.fit();
  }

  _centre(vx, vy) {
    if (typeof vx === 'number' && typeof vy === 'number') return { x: vx, y: vy };
    const v = this.viewportSize();
    return { x: v.width / 2, y: v.height / 2 };
  }
}
