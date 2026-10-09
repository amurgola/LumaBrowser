class RefImageClamp {
  static MAX_PIXELS = 1024 * 1024;
  static SLACK = 1.25;

  static boundFor(width, height) {
    return Math.max(RefImageClamp.MAX_PIXELS, (Number(width) || 0) * (Number(height) || 0));
  }

  static clamp(b64, maxPixels = RefImageClamp.MAX_PIXELS) {
    if (typeof b64 !== 'string' || !b64) return b64;
    try {
      return RefImageClamp._clampWithNativeImage(b64, maxPixels);
    } catch (_) {
      return b64;
    }
  }

  static _clampWithNativeImage(b64, maxPixels) {
    const { nativeImage } = require('electron');
    if (!nativeImage || typeof nativeImage.createFromBuffer !== 'function') return b64;
    const img = nativeImage.createFromBuffer(Buffer.from(b64, 'base64'));
    if (!img || img.isEmpty()) return b64;
    const { width, height } = img.getSize();
    if (!width || !height || width * height <= maxPixels * RefImageClamp.SLACK) return b64;
    const scale = Math.sqrt(maxPixels / (width * height));
    const resized = img.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), quality: 'good' });
    const png = resized.toPNG();
    return png && png.length ? png.toString('base64') : b64;
  }
}

module.exports = RefImageClamp;
