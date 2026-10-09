class CanvasModule {
  static _module = null;
  static _checked = false;

  static available() {
    return !!CanvasModule.get();
  }

  static get() {
    if (!CanvasModule._checked) {
      CanvasModule._checked = true;
      try { CanvasModule._module = require('@napi-rs/canvas'); } catch (_) { CanvasModule._module = null; }
    }
    return CanvasModule._module;
  }

  static async decodeToRgba(pngBuffer) {
    const canvas = CanvasModule.get();
    const img = await canvas.loadImage(pngBuffer);
    const c = canvas.createCanvas(img.width, img.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return { data: ctx.getImageData(0, 0, img.width, img.height).data, width: img.width, height: img.height };
  }

  static encodePng(rgba, w, h) {
    const c = CanvasModule.get().createCanvas(w, h);
    const ctx = c.getContext('2d');
    const imageData = ctx.createImageData(w, h);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);
    return c.toBuffer('image/png');
  }
}

module.exports = CanvasModule;
