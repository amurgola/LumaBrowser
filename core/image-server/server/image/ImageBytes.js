class ImageBytes {
  static toBase64(value) {
    if (value == null) return null;
    return Buffer.isBuffer(value) ? value.toString('base64') : String(value);
  }
}

module.exports = ImageBytes;
