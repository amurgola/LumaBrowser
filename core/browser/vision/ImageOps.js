class ImageOps {
  static PNG_IHDR = 0x49484452;

  constructor(nativeImage) {
    this._nativeImage = nativeImage;
  }

  static pngSize(buffer) {
    if (!ImageOps._isPng(buffer)) throw new Error('pngSize: not a PNG buffer');
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  normalize(image) {
    return this._nativeImage.createFromBuffer(image.toPNG());
  }

  fromPngBase64(base64) {
    return this._nativeImage.createFromBuffer(Buffer.from(base64, 'base64'));
  }

  size(image) {
    return image.getSize();
  }

  resize(image, width, height) {
    return this.normalize(image.resize({ width, height, quality: 'best' }));
  }

  crop(image, rect) {
    return this.normalize(image.crop(ImageOps._roundRect(rect)));
  }

  toDataUrl(image) {
    return `data:image/png;base64,${image.toPNG().toString('base64')}`;
  }

  static _isPng(buffer) {
    return !!buffer && buffer.length >= 24 && buffer.readUInt32BE(12) === ImageOps.PNG_IHDR;
  }

  static _roundRect(rect) {
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }
}

module.exports = ImageOps;
