class ScreenshotImage {
  static MAX_EDGE = 1600;

  static fromShot(nativeImage, shot) {
    const image = ScreenshotImage.fullSize(nativeImage, shot);
    const scale = Math.min(1, ScreenshotImage.MAX_EDGE / Math.max(shot.width, shot.height));
    if (scale >= 1) return image;
    const resized = image.resize({ width: Math.round(shot.width * scale), height: Math.round(shot.height * scale), quality: 'best' });
    return nativeImage.createFromBuffer(resized.toPNG());
  }

  static fullSize(nativeImage, shot) {
    return nativeImage.createFromBitmap(shot.bgra, { width: shot.width, height: shot.height });
  }
}

module.exports = ScreenshotImage;
