class CanvasLib {
  static _lib = null;

  static get() {
    if (!CanvasLib._lib) CanvasLib._lib = require('@napi-rs/canvas');
    return CanvasLib._lib;
  }

  static create(W, H) {
    return CanvasLib.get().createCanvas(W, H);
  }

  static loadImage(b64) {
    return CanvasLib.get().loadImage(Buffer.from(b64, 'base64'));
  }

  static toB64(canvas) {
    return canvas.toBuffer('image/png').toString('base64');
  }

  static async fromB64(b64) {
    const img = await CanvasLib.loadImage(b64);
    const c = CanvasLib.create(img.width, img.height);
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
  }

  static rgb(rgb) {
    return `rgb(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0})`;
  }
}

module.exports = CanvasLib;
