class TabFrameGrabber {
  static MAX_WIDTH = 1280;
  static JPEG_QUALITY = 68;

  constructor({ getWebContents, getView, getFallbackBounds } = {}) {
    this._getWebContents = getWebContents || (() => null);
    this._getView = getView || (() => null);
    this._getFallbackBounds = getFallbackBounds || (() => null);
  }

  async grab() {
    const wc = this.liveWebContents();
    if (!wc) return null;
    const size = this.viewSize();
    if (!size) return null;
    const img = await wc.capturePage();
    if (!img || (typeof img.isEmpty === 'function' && img.isEmpty())) return null;
    return TabFrameGrabber._encode(TabFrameGrabber._downscale(img), size);
  }

  liveWebContents() {
    const wc = this._getWebContents();
    if (!wc || (typeof wc.isDestroyed === 'function' && wc.isDestroyed())) return null;
    return wc;
  }

  viewSize() {
    const view = this._getView();
    if (!view) return null;
    let bounds = TabFrameGrabber._boundsOf(view);
    if (!bounds || !bounds.width || !bounds.height) bounds = this._sizeHiddenView(view);
    return bounds ? { width: bounds.width, height: bounds.height } : null;
  }

  _sizeHiddenView(view) {
    const fb = this._getFallbackBounds();
    if (!fb || !fb.width || !fb.height) return null;
    try { view.setBounds({ x: fb.x || 0, y: fb.y || 0, width: fb.width, height: fb.height }); } catch (_) { return null; }
    return TabFrameGrabber._boundsOf(view) || fb;
  }

  static _boundsOf(view) {
    try { return view.getBounds(); } catch (_) { return null; }
  }

  static _downscale(img) {
    if (img.getSize().width <= TabFrameGrabber.MAX_WIDTH) return img;
    return img.resize({ width: TabFrameGrabber.MAX_WIDTH, quality: 'good' });
  }

  static _encode(img, size) {
    const dims = img.getSize();
    return {
      jpeg: img.toJPEG(TabFrameGrabber.JPEG_QUALITY),
      meta: { w: dims.width, h: dims.height, vw: size.width, vh: size.height },
    };
  }
}

module.exports = TabFrameGrabber;
