class NativeBitmapCodec {
  static BYTES_PER_PIXEL = 4;

  static available() {
    return !!NativeBitmapCodec._nativeImage();
  }

  static decode(bytes) {
    const nativeImage = NativeBitmapCodec._nativeImage();
    const buf = NativeBitmapCodec.toBuffer(bytes);
    if (!nativeImage || !buf) return null;
    const img = nativeImage.createFromBuffer(buf);
    if (!img || img.isEmpty()) return null;
    const { width, height } = img.getSize();
    const data = img.toBitmap();
    if (!data || data.length !== width * height * NativeBitmapCodec.BYTES_PER_PIXEL) return null;
    return { width, height, data };
  }

  static encodePng(bitmap) {
    const img = NativeBitmapCodec._fromBitmap(bitmap);
    if (!img) return null;
    const png = img.toPNG();
    return png && png.length ? png : null;
  }

  static resize(bitmap, width, height) {
    const img = NativeBitmapCodec._fromBitmap(bitmap);
    if (!img) return null;
    const resized = img.resize({ width, height, quality: 'best' });
    const data = resized.toBitmap();
    if (!data || data.length !== width * height * NativeBitmapCodec.BYTES_PER_PIXEL) return null;
    return { width, height, data };
  }

  static toBuffer(value) {
    if (Buffer.isBuffer(value)) return value;
    if (typeof value !== 'string' || !value) return null;
    const comma = value.startsWith('data:') ? value.indexOf(',') : -1;
    return Buffer.from(comma >= 0 ? value.slice(comma + 1) : value, 'base64');
  }

  static _fromBitmap(bitmap) {
    const nativeImage = NativeBitmapCodec._nativeImage();
    if (!nativeImage || !bitmap || !bitmap.data) return null;
    const img = nativeImage.createFromBitmap(Buffer.from(bitmap.data.buffer, bitmap.data.byteOffset, bitmap.data.length), { width: bitmap.width, height: bitmap.height });
    return img && !img.isEmpty() ? img : null;
  }

  static _nativeImage() {
    try {
      const electron = require('electron');
      const nativeImage = electron && electron.nativeImage;
      return nativeImage && typeof nativeImage.createFromBuffer === 'function' ? nativeImage : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = NativeBitmapCodec;
