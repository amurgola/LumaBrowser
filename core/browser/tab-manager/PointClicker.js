const InputDriver = require('../InputDriver');
const VisionPageScripts = require('../vision/VisionPageScripts');
const NavigationReply = require('./NavigationReply');

class PointClicker {
  static BUTTONS = ['left', 'right', 'middle'];
  static NAVIGATION_WAIT_MS = 3000;

  static pointInfo(page, x, y) {
    return page.runEnvelope(VisionPageScripts.hitTestScript(x, y), 'hit test failed');
  }

  static async clickAt(page, options = {}) {
    const point = PointClicker._point(options);
    if (!point) return { success: false, error: 'x and y must be numbers (viewport CSS pixels)' };
    const hit = await page.run(VisionPageScripts.hitTestScript(point.x, point.y, { evidence: true }));
    if (!hit || !hit.success) return { success: false, error: (hit && hit.error) || 'hit test failed' };
    if (!hit.inView) return { success: false, error: PointClicker._outOfViewError(point, hit) };
    return PointClicker._clickAndReport(page, point, hit);
  }

  static async _clickAndReport(page, point, hit) {
    const preUrl = page.url();
    const evidence = await PointClicker._clickWatched(page, point, hit.fp);
    const data = {
      x: Math.round(point.x), y: Math.round(point.y), button: point.button, clickCount: point.clickCount,
      target: hit.target || null,
    };
    if (evidence) data.evidence = evidence;
    return NavigationReply.build(data, preUrl, page.url());
  }

  static async _clickWatched(page, point, before) {
    const watch = page.watchAction();
    try {
      await InputDriver.trustedClick(page.webContents, point.x, point.y, { button: point.button, clickCount: point.clickCount });
      const { evidence } = await watch.finish({ before, legacyWaitMs: PointClicker.NAVIGATION_WAIT_MS });
      return evidence;
    } finally {
      watch.cancel();
    }
  }

  static _point(options) {
    const x = Number(options.x);
    const y = Number(options.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return {
      x,
      y,
      button: PointClicker.BUTTONS.includes(options.button) ? options.button : 'left',
      clickCount: Number(options.clickCount) === 2 ? 2 : 1,
    };
  }

  static _outOfViewError(point, hit) {
    return `(${Math.round(point.x)}, ${Math.round(point.y)}) is outside the ${hit.cssWidth}x${hit.cssHeight} viewport. `
      + 'Take a fresh screenshot and use its pixel coordinates, or scroll first';
  }
}

module.exports = PointClicker;
