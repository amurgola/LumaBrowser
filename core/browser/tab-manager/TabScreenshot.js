const ElementDigest = require('../extraction/ElementDigest');
const ImageOps = require('../vision/ImageOps');
const VisionPageScripts = require('../vision/VisionPageScripts');
const ElementDigestFormatter = require('./ElementDigestFormatter');

class TabScreenshot {
  static FULL_PAGE_LAYOUT_MS = 500;
  static PAGE_SIZE_SCRIPT = '({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })';
  static VIEWPORT_SCRIPT = '[window.innerWidth, window.innerHeight]';

  constructor(nativeImage = null) {
    this._nativeImage = nativeImage;
  }

  async capture(page, options = {}) {
    if (options.fullPage) return this._captureFullPage(page);
    return this._captureViewport(page, options);
  }

  async _captureFullPage(page) {
    const dims = await page.run(TabScreenshot.PAGE_SIZE_SCRIPT);
    const originalBounds = page.view.getBounds();
    page.view.setBounds(TabScreenshot._grown(originalBounds, dims));
    const image = await TabScreenshot._captureThenRestore(page, originalBounds);
    return { success: true, data: { screenshot: image.toPNG().toString('base64'), mimeType: 'image/png' } };
  }

  static async _captureThenRestore(page, originalBounds) {
    try {
      await new Promise((resolve) => setTimeout(resolve, TabScreenshot.FULL_PAGE_LAYOUT_MS));
      return await page.webContents.capturePage();
    } finally {
      page.view.setBounds(originalBounds);
    }
  }

  async _captureViewport(page, options) {
    const marks = options.marks ? await TabScreenshot._drawMarks(page) : null;
    let png = await TabScreenshot._capturePng(page, marks);
    const frame = await TabScreenshot._frameOf(page, png);
    if (options.cssScale && TabScreenshot._needsCssScale(frame)) png = this._scaleToCss(png, frame);
    frame.scale = frame.imageWidth / frame.cssWidth;
    const data = { screenshot: png.toString('base64'), mimeType: 'image/png', frame };
    if (marks) data.marks = marks;
    return { success: true, data };
  }

  static async _drawMarks(page) {
    const digest = await page.run(ElementDigest.SCRIPT);
    if (!digest || !digest.success) return null;
    const drawn = await page.run(VisionPageScripts.drawMarksScript(digest.viewport));
    return { text: ElementDigestFormatter.format(digest), count: (drawn && drawn.count) || 0 };
  }

  static async _capturePng(page, marks) {
    try {
      return (await page.webContents.capturePage()).toPNG();
    } finally {
      if (marks) await page.run(VisionPageScripts.removeMarksScript()).catch(() => {});
    }
  }

  static async _frameOf(page, png) {
    const px = ImageOps.pngSize(png);
    const vp = await page.run(TabScreenshot.VIEWPORT_SCRIPT);
    return { imageWidth: px.width, imageHeight: px.height, cssWidth: vp[0], cssHeight: vp[1] };
  }

  static _needsCssScale(frame) {
    const differs = frame.imageWidth !== frame.cssWidth || frame.imageHeight !== frame.cssHeight;
    return differs && frame.cssWidth > 0 && frame.cssHeight > 0;
  }

  _scaleToCss(png, frame) {
    const scaled = this._nativeImageModule().createFromBuffer(png)
      .resize({ width: frame.cssWidth, height: frame.cssHeight, quality: 'best' })
      .toPNG();
    frame.imageWidth = frame.cssWidth;
    frame.imageHeight = frame.cssHeight;
    return scaled;
  }

  _nativeImageModule() {
    if (!this._nativeImage) this._nativeImage = require('electron').nativeImage;
    return this._nativeImage;
  }

  static _grown(bounds, dims) {
    return {
      x: bounds.x,
      y: bounds.y,
      width: Math.max(bounds.width, dims.width),
      height: Math.max(bounds.height, dims.height),
    };
  }
}

module.exports = TabScreenshot;
