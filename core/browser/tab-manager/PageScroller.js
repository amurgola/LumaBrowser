const ActionEvidenceScripts = require('../ActionEvidenceScripts');

class PageScroller {
  static DEFAULT_AMOUNT = 600;

  static async scroll(page, options = {}) {
    const script = PageScroller.script(options);
    const watch = page.watchAction();
    try {
      return await PageScroller._scrollWatched(page, watch, script);
    } catch (error) {
      watch.cancel();
      return { success: false, error: error.message };
    }
  }

  static script({ selector, direction = 'down', amount = PageScroller.DEFAULT_AMOUNT } = {}) {
    const fpExpr = ActionEvidenceScripts.beforeExpr();
    if (selector) return PageScroller._intoViewScript(selector, fpExpr);
    if (direction === 'top' || direction === 'bottom') return PageScroller._jumpScript(direction, fpExpr);
    return PageScroller._relativeScript(direction, amount, fpExpr);
  }

  static _intoViewScript(selector, fpExpr) {
    return `
(function() {
  try {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { success: false, error: 'Element not found' };
    const fp = ${fpExpr};
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return { success: true, scrolledTo: ${JSON.stringify(selector)}, fp };
  } catch(e) { return { success: false, error: e.message }; }
})();`.trim();
  }

  static _jumpScript(direction, fpExpr) {
    const top = direction === 'top' ? '0' : 'document.documentElement.scrollHeight';
    return PageScroller._windowScrollScript(`window.scrollTo({ left: window.scrollX, top: ${top}, behavior: 'smooth' });`, fpExpr);
  }

  static _relativeScript(direction, amount, fpExpr) {
    const { dx, dy } = PageScroller._delta(direction, amount);
    return PageScroller._windowScrollScript(`window.scrollBy({ left: ${dx}, top: ${dy}, behavior: 'smooth' });`, fpExpr);
  }

  static _windowScrollScript(scrollStatement, fpExpr) {
    return `
(function() {
  try {
    const fp = ${fpExpr};
    ${scrollStatement}
    return { success: true, scrollX: window.scrollX, scrollY: window.scrollY, pageHeight: document.documentElement.scrollHeight, fp };
  } catch(e) { return { success: false, error: e.message }; }
})();`.trim();
  }

  static _delta(direction, amount) {
    if (direction === 'left') return { dx: -amount, dy: 0 };
    if (direction === 'right') return { dx: amount, dy: 0 };
    return { dx: 0, dy: direction === 'up' ? -amount : amount };
  }

  static async _scrollWatched(page, watch, script) {
    const res = await page.runEnvelope(script);
    if (!res.success) {
      watch.cancel();
      return res;
    }
    const { fp, ...data } = res.data;
    const { evidence, after } = await watch.finish({ before: fp, legacyWaitMs: 0 });
    if (after && 'scrollY' in data) {
      data.scrollX = after.sx;
      data.scrollY = after.sy;
    }
    if (evidence) data.evidence = evidence;
    return { success: true, data };
  }
}

module.exports = PageScroller;
