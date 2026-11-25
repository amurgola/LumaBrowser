export default class FrameFit {
  static SETTLE_MS = 300;
  static BASELINE_DENSITY = 160;

  constructor(element, send) {
    this._element = element;
    this._send = send;
    this._timer = null;
    this._last = '';
  }

  attach() {
    new ResizeObserver(() => this.schedule()).observe(this._element);
  }

  schedule() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.request(), FrameFit.SETTLE_MS);
  }

  requestNow() {
    this._last = '';
    this.request();
  }

  request() {
    const frame = FrameFit.frameOf(this._element.getBoundingClientRect(), window.devicePixelRatio || 1);
    const key = `${frame.width}x${frame.height}@${frame.density}`;
    if (key === this._last || frame.width < 1 || frame.height < 1) return;
    this._last = key;
    this._send({ type: 'resize', ...frame });
  }

  static frameOf(box, scale) {
    return {
      width: Math.floor(box.width * scale),
      height: Math.floor(box.height * scale),
      density: Math.round(FrameFit.BASELINE_DENSITY * scale),
    };
  }
}
