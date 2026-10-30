const EditRegionMask = require('./EditRegionMask');
const NativeBitmapCodec = require('./NativeBitmapCodec');
const RegionMaskPrep = require('./RegionMaskPrep');

class OutpaintCanvas {
  static BYTES_PER_PIXEL = 4;
  static ANCHORS = ['center', 'top', 'bottom', 'left', 'right'];
  static DEFAULT_ANCHOR = 'center';
  static MIN_PAD_PX = 8;

  static build({ sourceBytes, width, height, anchor = OutpaintCanvas.DEFAULT_ANCHOR, codec = NativeBitmapCodec }) {
    const source = codec.decode(sourceBytes);
    if (!source || !(width > 0) || !(height > 0)) return null;
    const placed = OutpaintCanvas.place({ sw: source.width, sh: source.height, width, height, anchor });
    if (!placed) return null;
    const same = placed.width === source.width && placed.height === source.height;
    const fitted = same ? source : codec.resize(source, placed.width, placed.height);
    if (!fitted) return null;
    const mask = OutpaintCanvas.mask(placed, width, height);
    const grown = EditRegionMask.dilate(mask, RegionMaskPrep.growPx(width, height));
    const png = codec.encodePng(OutpaintCanvas.pad(fitted, placed, width, height));
    const maskPng = codec.encodePng(EditRegionMask.toBitmap(grown));
    if (!png || !maskPng) return null;
    return { png, maskPng, grown, featherPx: RegionMaskPrep.featherPx(width, height), placed, sides: OutpaintCanvas.sides(placed, width, height) };
  }

  static place({ sw, sh, width, height, anchor }) {
    if (!(sw > 0 && sh > 0 && width > 0 && height > 0)) return null;
    const scale = Math.min(width / sw, height / sh);
    const w = Math.max(1, Math.min(width, Math.round(sw * scale)));
    const h = Math.max(1, Math.min(height, Math.round(sh * scale)));
    const padX = width - w;
    const padY = height - h;
    if (padX < OutpaintCanvas.MIN_PAD_PX && padY < OutpaintCanvas.MIN_PAD_PX) return null;
    const a = OutpaintCanvas.ANCHORS.includes(anchor) ? anchor : OutpaintCanvas.DEFAULT_ANCHOR;
    const x = a === 'left' ? 0 : (a === 'right' ? padX : Math.round(padX / 2));
    const y = a === 'top' ? 0 : (a === 'bottom' ? padY : Math.round(padY / 2));
    return { x, y, width: w, height: h };
  }

  static pad(fitted, placed, width, height) {
    const bpp = OutpaintCanvas.BYTES_PER_PIXEL;
    const data = Buffer.alloc(width * height * bpp);
    const src = Buffer.from(fitted.data.buffer, fitted.data.byteOffset, fitted.data.length);
    for (let y = 0; y < height; y++) {
      const sy = Math.max(0, Math.min(placed.height - 1, y - placed.y));
      for (let x = 0; x < width; x++) {
        const sx = Math.max(0, Math.min(placed.width - 1, x - placed.x));
        const from = (sy * placed.width + sx) * bpp;
        src.copy(data, (y * width + x) * bpp, from, from + bpp);
      }
    }
    return { width, height, data };
  }

  static mask(placed, width, height) {
    const out = EditRegionMask.blank(width, height, 255);
    for (let y = placed.y; y < placed.y + placed.height; y++) {
      out.data.fill(0, y * width + placed.x, y * width + placed.x + placed.width);
    }
    return out;
  }

  static sides(placed, width, height) {
    const out = [];
    const min = OutpaintCanvas.MIN_PAD_PX;
    if (placed.x >= min) out.push('left');
    if (placed.y >= min) out.push('top');
    if (width - placed.x - placed.width >= min) out.push('right');
    if (height - placed.y - placed.height >= min) out.push('bottom');
    return out;
  }
}

module.exports = OutpaintCanvas;
