const ElementDigest = require('../extraction/ElementDigest');
const InputDriver = require('../InputDriver');
const ImageOps = require('../vision/ImageOps');
const VisionPageScripts = require('../vision/VisionPageScripts');
const ElementDigestFormatter = require('./ElementDigestFormatter');
const CaptureStage = require('./CaptureStage');

class TabScreenshot {
  static FULL_PAGE_LAYOUT_MS = 500;
  static PAGE_SIZE_SCRIPT = '({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })';
  static VIEWPORT_SCRIPT = '[window.innerWidth, window.innerHeight]';
  static NOT_PAINTED_ERROR = 'The page has not painted anything to capture yet';

  constructor(nativeImage = null, stage = new CaptureStage()) {
    this._nativeImage = nativeImage;
    this._stage = stage;
  }

  async capture(page, options = {}) {
    if (this._stage.isOnScreen(page.view)) return this._captureKind(page, options);
    return this._captureOnStage(page, options);
  }

  _captureKind(page, options) {
    if (options.selector) return this._captureElement(page, options.selector);
    if (options.fullPage) return this._captureFullPage(page);
    return this._captureViewport(page, options);
  }

  async _captureOnStage(page, options) {
    try {
      return await this._stage.lend(page.view, () => {
        page.tabViewManager.freeViewport(page.tabId);
        return this._captureKind(page, options);
      });
    } finally {
      page.tabViewManager.layoutTab(page.tabId);
    }
  }

  static elementRectScript(selector) {
    return `(function() {
  try {
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { success: false, error: 'No element found for selector "' + ${JSON.stringify(selector)} + '"' };
    el.scrollIntoView({ block: 'center', inline: 'center' });
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return { success: false, error: 'The element has no size to capture' };
    return { success: true, x: r.left, y: r.top, width: r.width, height: r.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
  } catch (e) { return { success: false, error: e.message }; }
})();`;
  }

  async _captureElement(page, selector) {
    const script = TabScreenshot.elementRectScript(selector);
    const measured = await page.run(script);
    if (!measured || !measured.success) return { success: false, error: (measured && measured.error) || 'Could not measure the element' };
    const fits = measured.width <= measured.viewportWidth && measured.height <= measured.viewportHeight;
    const image = fits
      ? await this._grab(page, TabScreenshot._clipOf(page, measured))
      : await this._captureGrown(page, script, measured);
    if (!image) return { success: false, error: 'The element moved while it was being captured' };
    return { success: true, data: { screenshot: image.toPNG().toString('base64'), mimeType: 'image/png', element: { selector } } };
  }

  async _captureGrown(page, script, measured) {
    const originalBounds = page.view.getBounds();
    page.view.setBounds(TabScreenshot._grown(originalBounds, { width: Math.ceil(measured.width), height: Math.ceil(measured.height) }));
    try {
      await new Promise((resolve) => setTimeout(resolve, TabScreenshot.FULL_PAGE_LAYOUT_MS));
      const rect = await page.run(script);
      if (!rect || !rect.success) return null;
      return await this._grab(page, TabScreenshot._clipOf(page, rect));
    } finally {
      page.view.setBounds(originalBounds);
    }
  }

  static _clipOf(page, rect) {
    const from = InputDriver.toDip(page.webContents, Math.max(0, rect.x), Math.max(0, rect.y));
    const to = InputDriver.toDip(page.webContents, rect.x + rect.width, rect.y + rect.height);
    return { x: from.x, y: from.y, width: Math.max(1, to.x - from.x), height: Math.max(1, to.y - from.y) };
  }

  async _captureFullPage(page) {
    const dims = await page.run(TabScreenshot.PAGE_SIZE_SCRIPT);
    const originalBounds = page.view.getBounds();
    page.view.setBounds(TabScreenshot._grown(originalBounds, dims));
    const image = await this._captureThenRestore(page, originalBounds);
    return { success: true, data: { screenshot: image.toPNG().toString('base64'), mimeType: 'image/png' } };
  }

  async _captureThenRestore(page, originalBounds) {
    try {
      await new Promise((resolve) => setTimeout(resolve, TabScreenshot.FULL_PAGE_LAYOUT_MS));
      return await this._grab(page);
    } finally {
      page.view.setBounds(originalBounds);
    }
  }

  async _captureViewport(page, options) {
    const marks = options.marks ? await TabScreenshot._drawMarks(page) : null;
    let png = await this._capturePng(page, marks);
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

  async _capturePng(page, marks) {
    try {
      return (await this._grab(page)).toPNG();
    } finally {
      if (marks) await page.run(VisionPageScripts.removeMarksScript()).catch(() => {});
    }
  }

  async _grab(page, clip) {
    const image = this._stage.isOnScreen(page.view)
      ? await page.webContents.capturePage(clip)
      : await this._stage.capture(page.webContents, clip);
    if (!image || image.isEmpty()) throw new Error(TabScreenshot.NOT_PAINTED_ERROR);
    return image;
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
