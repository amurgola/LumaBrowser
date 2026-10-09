const ImageDimensions = require('../shared/content/ImageDimensions');
const RefSizePlanner = require('./RefSizePlanner');

class RefImagePresizer {
  static presize({ refImages, canvas, refArea, grid = RefSizePlanner.DEFAULT_GRID, resize = RefImagePresizer.nativeResize }) {
    const list = (Array.isArray(refImages) ? refImages : []).filter(Boolean);
    const untouched = { refImages: list, sized: false, sizes: list.map(() => null) };
    if (!list.length) return untouched;
    try {
      return RefImagePresizer._presizeAll(list, { canvas, refArea, grid, resize }) || untouched;
    } catch (_) {
      return untouched;
    }
  }

  static nativeResize(buf, width, height) {
    const { nativeImage } = require('electron');
    if (!nativeImage || typeof nativeImage.createFromBuffer !== 'function') return null;
    const img = nativeImage.createFromBuffer(buf);
    if (!img || img.isEmpty()) return null;
    const png = img.resize({ width, height, quality: 'best' }).toPNG();
    return png && png.length ? png : null;
  }

  static toBuffer(value) {
    if (Buffer.isBuffer(value)) return value;
    if (typeof value !== 'string' || !value) return null;
    const comma = value.startsWith('data:') ? value.indexOf(',') : -1;
    return Buffer.from(comma >= 0 ? value.slice(comma + 1) : value, 'base64');
  }

  static _presizeAll(list, { canvas, refArea, grid, resize }) {
    const bufs = list.map(RefImagePresizer.toBuffer);
    const dims = bufs.map((b) => (b ? ImageDimensions.read(b) : null));
    if (dims.some((d) => !d)) return null;
    const plan = RefSizePlanner.plan({ dims, canvas, refArea, grid });
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const sized = RefImagePresizer._sizeOne(list[i], bufs[i], dims[i], plan[i], resize);
      if (!sized) return null;
      out.push(sized);
    }
    return { refImages: out, sized: true, sizes: plan };
  }

  static _sizeOne(original, buf, dim, target, resize) {
    if (!target) return null;
    if (target.width === dim.width && target.height === dim.height) return original;
    return resize(buf, target.width, target.height) || null;
  }
}

module.exports = RefImagePresizer;
