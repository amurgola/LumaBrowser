export default class RegionViewport {
  static MIN_ZOOM = 1;
  static MAX_ZOOM = 8;
  static WHEEL_STEP = 1.2;

  constructor({ viewport, stage, width, height }) {
    this._viewport = viewport;
    this._stage = stage;
    this._width = width;
    this._height = height;
    this.zoom = 1;
    this.x = 0;
    this.y = 0;
    this.fit();
  }

  viewportSize() {
    const w = this._viewport.clientWidth || 1;
    const h = this._viewport.clientHeight || 1;
    return { width: w, height: h };
  }

  fitScale() {
    const { width, height } = this.viewportSize();
    return Math.min(width / this._width, height / this._height, 1);
  }

  get scale() {
    return this.fitScale() * this.zoom;
  }

  displaySize() {
    const s = this.scale;
    return { width: this._width * s, height: this._height * s };
  }

  fit() {
    this.zoom = 1;
    this.x = 0;
    this.y = 0;
    this.layout();
  }

  zoomAt(factor, vx, vy) {
    const before = this.zoom;
    const next = RegionViewport._clamp(before * factor, RegionViewport.MIN_ZOOM, RegionViewport.MAX_ZOOM);
    if (next === before) return false;
    const ratio = next / before;
    this.x = vx - (vx - this.x) * ratio;
    this.y = vy - (vy - this.y) * ratio;
    this.zoom = next;
    this.layout();
    return true;
  }

  panBy(dx, dy) {
    if (this.zoom <= RegionViewport.MIN_ZOOM) return false;
    this.x += dx;
    this.y += dy;
    this.layout();
    return true;
  }

  toViewport(point) {
    const s = this.scale;
    return { x: this.x + point.x * s, y: this.y + point.y * s };
  }

  rectToViewport(rect) {
    const s = this.scale;
    return { x: this.x + rect.x * s, y: this.y + rect.y * s, width: rect.width * s, height: rect.height * s };
  }

  layout() {
    const view = this.viewportSize();
    const shown = this.displaySize();
    this.x = RegionViewport._axis(this.x, shown.width, view.width);
    this.y = RegionViewport._axis(this.y, shown.height, view.height);
    const st = this._stage.style;
    st.left = `${this.x}px`;
    st.top = `${this.y}px`;
    st.width = `${shown.width}px`;
    st.height = `${shown.height}px`;
  }

  static _axis(offset, shown, view) {
    if (shown <= view) return (view - shown) / 2;
    return RegionViewport._clamp(offset, view - shown, 0);
  }

  static _clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}
