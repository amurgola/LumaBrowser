class ImageDimensions {
  static MIN_HEADER_BYTES = 24;
  static JPEG_NON_FRAME_MARKERS = [0xc4, 0xc8, 0xcc];

  static read(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < ImageDimensions.MIN_HEADER_BYTES) return null;
    if (ImageDimensions._isPng(buf)) return ImageDimensions._readPng(buf);
    if (ImageDimensions._isJpeg(buf)) return ImageDimensions._readJpeg(buf);
    return null;
  }

  static fitToBudget({ srcWidth, srcHeight, budgetWidth, budgetHeight, multiple = 16 }) {
    const [sw, sh, bw, bh] = [srcWidth, srcHeight, budgetWidth, budgetHeight].map(Number);
    if (![sw, sh, bw, bh].every((v) => v > 0)) return null;
    const aspect = sw / sh;
    const height = Math.sqrt((bw * bh) / aspect);
    return {
      width: ImageDimensions._snap(height * aspect, multiple),
      height: ImageDimensions._snap(height, multiple),
    };
  }

  static _isPng(buf) {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }

  static _isJpeg(buf) {
    return buf[0] === 0xff && buf[1] === 0xd8;
  }

  static _readPng(buf) {
    return ImageDimensions._positive(buf.readUInt32BE(16), buf.readUInt32BE(20));
  }

  static _readJpeg(buf) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) { offset++; continue; }
      if (ImageDimensions._isStartOfFrame(buf[offset + 1])) {
        return ImageDimensions._positive(buf.readUInt16BE(offset + 7), buf.readUInt16BE(offset + 5));
      }
      const segmentLength = buf.readUInt16BE(offset + 2);
      if (segmentLength < 2) return null;
      offset += 2 + segmentLength;
    }
    return null;
  }

  static _isStartOfFrame(marker) {
    return marker >= 0xc0 && marker <= 0xcf && !ImageDimensions.JPEG_NON_FRAME_MARKERS.includes(marker);
  }

  static _positive(width, height) {
    return width > 0 && height > 0 ? { width, height } : null;
  }

  static _snap(value, multiple) {
    return Math.max(multiple, Math.round(value / multiple) * multiple);
  }
}

module.exports = ImageDimensions;
