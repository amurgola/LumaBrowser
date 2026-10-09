const ActionEvidenceScripts = require('../ActionEvidenceScripts');
const NavigationReply = require('./NavigationReply');
const TargetScripts = require('./TargetScripts');

class KeyPresser {
  static NAVIGATING_KEY = 'Enter';
  static NAVIGATION_WAIT_MS = 3000;

  static async pressKey(page, options = {}) {
    const { key } = options;
    if (!key) return { success: false, error: 'key is required' };
    const script = KeyPresser.script(KeyPresser._selectorOf(options), key);
    const watch = page.watchAction();
    try {
      return await KeyPresser._pressWatched(page, watch, script, key);
    } catch (error) {
      watch.cancel();
      return { success: false, error: error.message };
    }
  }

  static script(selector, key) {
    return `
(function() {
  try {
    let target = document.activeElement || document.body;
    const sel = ${JSON.stringify(selector || null)};
    if (sel) {
      const el = document.querySelector(sel);
      if (!el) return { success: false, error: 'Element not found: ' + sel };
      el.focus();
      target = el;
    }
    // Before-snapshot AFTER the focus above, so the focus we gave the field
    // is not reported as the key's effect.
    const fp = ${ActionEvidenceScripts.beforeExpr('target === document.body ? null : target')};
    const keyName = ${JSON.stringify(key)};
    const opts = { key: keyName, code: 'Key' + keyName, bubbles: true, cancelable: true };
    if (keyName === 'Enter') opts.code = 'Enter';
    if (keyName === 'Escape') opts.code = 'Escape';
    if (keyName === 'Tab') opts.code = 'Tab';
    if (keyName === 'Backspace') opts.code = 'Backspace';
    if (keyName === 'ArrowDown') opts.code = 'ArrowDown';
    if (keyName === 'ArrowUp') opts.code = 'ArrowUp';
    if (keyName === 'ArrowLeft') opts.code = 'ArrowLeft';
    if (keyName === 'ArrowRight') opts.code = 'ArrowRight';
    const down = new KeyboardEvent('keydown', opts);
    const handledByPage = !target.dispatchEvent(down); // false when the page called preventDefault
    target.dispatchEvent(new KeyboardEvent('keypress', opts));
    target.dispatchEvent(new KeyboardEvent('keyup', opts));
    let submitted = false;
    if (keyName === 'Enter' && !handledByPage) {
      const field = ['INPUT', 'TEXTAREA'].includes(target.tagName) ? target : null;
      const form = field && field.tagName === 'INPUT' ? field.form : null;
      if (form) {
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.submit();
        submitted = true;
      }
    }
    const out = { success: true, key: keyName, target: target.tagName, submitted, fp };
    if (target === document.body) {
      out.warning = 'No element was focused; the key went to <body> and almost '
        + 'certainly did nothing. Pass a selector to press_key, or click the field first.';
    }
    return out;
  } catch(e) { return { success: false, error: e.message }; }
})();`.trim();
  }

  static _selectorOf({ selector, ref }) {
    const refNum = TargetScripts.refNumber(ref);
    return refNum != null ? `[data-luma-ref="${refNum}"]` : selector;
  }

  static async _pressWatched(page, watch, script, key) {
    const preUrl = page.url();
    const raw = await page.run(script);
    if (!raw.success) {
      watch.cancel();
      return { success: false, error: raw.error };
    }
    const { fp, ...result } = raw;
    const shouldWait = String(key) === KeyPresser.NAVIGATING_KEY;
    const { evidence } = await watch.finish({ before: fp, legacyWaitMs: shouldWait ? KeyPresser.NAVIGATION_WAIT_MS : 0 });
    if (evidence) result.evidence = evidence;
    return KeyPresser._reply(result, preUrl, page.url(), shouldWait);
  }

  static _reply(result, preUrl, postUrl, shouldWait) {
    const reply = NavigationReply.build(result, preUrl, postUrl);
    if (reply.urlChanged || !shouldWait) return reply;
    return { success: true, data: { ...result, urlChanged: false, note: 'URL did not change after Enter' } };
  }
}

module.exports = KeyPresser;
