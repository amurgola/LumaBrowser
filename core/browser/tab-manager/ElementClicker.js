const InputDriver = require('../InputDriver');
const NavigationReply = require('./NavigationReply');
const TargetScripts = require('./TargetScripts');

class ElementClicker {
  static NAVIGATION_WAIT_MS = 3000;

  static async click(page, options = {}) {
    const { selector, text, ref } = options;
    if (!selector && ref == null) return { success: false, error: 'selector or ref is required' };
    const watch = page.watchAction();
    try {
      return await ElementClicker._clickWatched(page, watch, { selector, text, ref });
    } catch (error) {
      watch.cancel();
      return { success: false, error: error.message };
    }
  }

  static async _clickWatched(page, watch, target) {
    const preClickUrl = page.url();
    const resolved = await page.run(TargetScripts.resolve(target));
    if (!resolved.success) {
      watch.cancel();
      return { success: false, error: resolved.error };
    }
    const clicked = await ElementClicker._deliver(page, resolved);
    if (!clicked.success) {
      watch.cancel(resolved.fp);
      return clicked;
    }
    const { evidence } = await watch.finish({ before: resolved.fp, legacyWaitMs: ElementClicker.NAVIGATION_WAIT_MS });
    const data = { tagName: resolved.tagName, text: resolved.text, method: clicked.method };
    if (evidence) data.evidence = evidence;
    return NavigationReply.build(data, preClickUrl, page.url());
  }

  static async _deliver(page, resolved) {
    if (!resolved.occluded) {
      await InputDriver.trustedClick(page.webContents, resolved.x, resolved.y);
      return { success: true, method: 'input' };
    }
    const fallback = await page.run(TargetScripts.syntheticClick());
    if (!fallback.success) return { success: false, error: fallback.error };
    return { success: true, method: 'synthetic' };
  }
}

module.exports = ElementClicker;
