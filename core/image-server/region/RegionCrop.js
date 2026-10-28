const NativeBitmapCodec = require('./NativeBitmapCodec');

class RegionCrop {
  static BYTES_PER_PIXEL = 4;
  static PAD_SHARE = 0.6;
  static MIN_PAD_PX = 48;
  static MIN_SIDE = 512;
  static FULL_SHARE = 0.5;

  static box({ bounds, width, height }) {
    if (!bounds || !(bounds.width > 0) || !(bounds.height > 0) || !(width > 0) || !(height > 0)) return null;
    const longer = Math.max(bounds.width, bounds.height);
    const pad = Math.max(RegionCrop.MIN_PAD_PX, Math.round(longer * RegionCrop.PAD_SHARE));
    const side = Math.max(RegionCrop.MIN_SIDE, longer + 2 * pad);
    const w = Math.min(width, side);
    const h = Math.min(height, side);
    if (w * h >= width * height * RegionCrop.FULL_SHARE) return null;
    const x = RegionCrop._clamp(Math.round(bounds.x + bounds.width / 2 - w / 2), 0, width - w);
    const y = RegionCrop._clamp(Math.round(bounds.y + bounds.height / 2 - h / 2), 0, height - h);
    return { x, y, width: w, height: h };
  }

  static cut(bitmap, rect) {
    const bpp = RegionCrop.BYTES_PER_PIXEL;
    const data = Buffer.alloc(rect.width * rect.height * bpp);
    for (let y = 0; y < rect.height; y++) {
      const from = ((rect.y + y) * bitmap.width + rect.x) * bpp;
      Buffer.from(bitmap.data.buffer, bitmap.data.byteOffset + from, rect.width * bpp).copy(data, y * rect.width * bpp);
    }
    return { width: rect.width, height: rect.height, data };
  }

  static paste(bitmap, patch, rect) {
    const bpp = RegionCrop.BYTES_PER_PIXEL;
    const out = Buffer.alloc(bitmap.data.length);
    Buffer.from(bitmap.data.buffer, bitmap.data.byteOffset, bitmap.data.length).copy(out);
    for (let y = 0; y < rect.height; y++) {
      const to = ((rect.y + y) * bitmap.width + rect.x) * bpp;
      Buffer.from(patch.data.buffer, patch.data.byteOffset + y * rect.width * bpp, rect.width * bpp).copy(out, to);
    }
    return { width: bitmap.width, height: bitmap.height, data: out };
  }

  static cutPng({ sourceBytes, rect, codec = NativeBitmapCodec }) {
    const source = codec.decode(sourceBytes);
    if (!source || !rect || rect.x + rect.width > source.width || rect.y + rect.height > source.height) return null;
    return codec.encodePng(RegionCrop.cut(source, rect)) || null;
  }

  static _clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}

module.exports = RegionCrop;
