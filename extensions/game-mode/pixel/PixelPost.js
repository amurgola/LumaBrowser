const CanvasModule = require('./CanvasModule');
const BackgroundKeyer = require('./BackgroundKeyer');
const KCentroid = require('./KCentroid');
const NearestUpscale = require('./NearestUpscale');
const PaletteQuantizer = require('./PaletteQuantizer');

class PixelPost {
  static available() {
    return CanvasModule.available();
  }

  static async pixelArtProcess(pngBuffer, outW, outH, { paletteSize = 24, transparent = false, report = null, upscaleTo = null } = {}) {
    if (!PixelPost.available()) return null;
    try {
      const { data, width, height } = await CanvasModule.decodeToRgba(pngBuffer);
      if (transparent) PixelPost._report(report, BackgroundKeyer.key(data, width, height));
      const small = PaletteQuantizer.quantize(KCentroid.downscale(data, width, height, outW, outH), paletteSize);
      const up = PixelPost._upscaleTarget(upscaleTo, outW, outH);
      if (up) return CanvasModule.encodePng(NearestUpscale.apply(small, outW, outH, up.width, up.height), up.width, up.height);
      return CanvasModule.encodePng(small, outW, outH);
    } catch (_) { return null; }
  }

  static async removeBackground(pngBuffer) {
    if (!PixelPost.available()) return null;
    try {
      const { data, width, height } = await CanvasModule.decodeToRgba(pngBuffer);
      if (!BackgroundKeyer.key(data, width, height)) return null;
      return CanvasModule.encodePng(data, width, height);
    } catch (_) { return null; }
  }

  static async smoothProcess(pngBuffer, outW, outH, { transparent = false, report = null } = {}) {
    if (!PixelPost.available()) return null;
    try {
      const canvas = CanvasModule.get();
      const img = await canvas.loadImage(pngBuffer);
      const source = canvas.createCanvas(img.width, img.height);
      source.getContext('2d').drawImage(img, 0, 0);
      const keyed = transparent ? PixelPost._keyCanvas(source, img.width, img.height, report) : null;
      if (img.width === outW && img.height === outH) return keyed ? source.toBuffer('image/png') : null;
      return PixelPost._resize(canvas, source, outW, outH);
    } catch (_) { return null; }
  }

  static _keyCanvas(source, width, height, report) {
    const ctx = source.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    const keyed = BackgroundKeyer.key(imageData.data, width, height);
    PixelPost._report(report, keyed);
    if (keyed) ctx.putImageData(imageData, 0, 0);
    return keyed;
  }

  static _resize(canvas, source, outW, outH) {
    const c = canvas.createCanvas(outW, outH);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, outW, outH);
    return c.toBuffer('image/png');
  }

  static _report(report, keyed) {
    if (report) report.keyed = !!keyed;
  }

  static _upscaleTarget(upscaleTo, outW, outH) {
    if (!upscaleTo || !(upscaleTo.width > 0) || !(upscaleTo.height > 0)) return null;
    return upscaleTo.width !== outW || upscaleTo.height !== outH ? upscaleTo : null;
  }
}

module.exports = PixelPost;
