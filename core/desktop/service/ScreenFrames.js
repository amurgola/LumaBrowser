class ScreenFrames {
  constructor() {
    this._frames = new Map();
  }

  record(frame) {
    this._frames.set(frame.hwnd, frame);
  }

  toScreen(w, x, y) {
    const frame = this._frames.get(w.hwnd);
    if (!frame) throw new Error('x/y are pixels of a desktop_screenshot of this window; take one first.');
    const point = ScreenFrames._map(frame, x, y);
    if (!ScreenFrames._inside(w.rect, point)) {
      throw new Error('That point is outside the window (it may have moved); take a fresh desktop_screenshot.');
    }
    return point;
  }

  toScreenLoose(w, x, y) {
    const frame = this._frames.get(w.hwnd);
    return frame ? ScreenFrames._map(frame, x, y) : null;
  }

  static _map(frame, x, y) {
    return {
      sx: frame.screen.x + Number(x) * (frame.screen.width / frame.imageWidth),
      sy: frame.screen.y + Number(y) * (frame.screen.height / frame.imageHeight),
    };
  }

  static _inside(rect, { sx, sy }) {
    return sx >= rect.x && sy >= rect.y && sx < rect.x + rect.width && sy < rect.y + rect.height;
  }
}

module.exports = ScreenFrames;
