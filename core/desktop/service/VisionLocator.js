const ScreenshotImage = require('./ScreenshotImage');

class VisionLocator {
  constructor(parts) {
    this._parts = parts;
  }

  get available() {
    return !!this._parts.visualGrounding;
  }

  async locate(w, description, { zoom = false } = {}) {
    const { nativeImage, visualGrounding } = this._parts;
    if (!visualGrounding) return { result: { success: false, error: 'Visual grounding is not available.' } };
    const { rect, shot } = this._parts.capture(w);
    const png = ScreenshotImage.fullSize(nativeImage, shot).toPNG();
    const found = await visualGrounding.locateInImage(nativeImage.createFromBuffer(png), description,
      { zoom: zoom === true, what: w.desktop ? 'the desktop' : `the "${w.title}" window`, skipVisionCheck: false });
    if (!found.success) return { result: found };
    const sx = rect.x + found.data.point.x * (rect.width / shot.width);
    const sy = rect.y + found.data.point.y * (rect.height / shot.height);
    return { point: { sx, sy }, ms: found.data.ms };
  }
}

module.exports = VisionLocator;
