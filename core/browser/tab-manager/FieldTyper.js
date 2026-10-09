const InputDriver = require('../InputDriver');
const NavigationReply = require('./NavigationReply');
const TargetScripts = require('./TargetScripts');

class FieldTyper {
  static SUBMIT_WAIT_MS = 3000;

  static async typeInto(page, options = {}) {
    const { selector, ref, text, submit = false, clear = true } = options;
    if (text == null) return { success: false, error: 'text is required' };
    if (!selector && ref == null) return { success: false, error: 'selector or ref is required' };
    const watch = page.watchAction();
    try {
      return await FieldTyper._typeWatched(page, watch, { selector, ref, text, submit, clear });
    } catch (error) {
      watch.cancel();
      return { success: false, error: error.message };
    }
  }

  static async _typeWatched(page, watch, request) {
    const preUrl = page.url();
    const resolved = await page.run(TargetScripts.resolve({ selector: request.selector, text: null, ref: request.ref }));
    if (!resolved.success) {
      watch.cancel();
      return { success: false, error: resolved.error };
    }
    const method = await FieldTyper._focus(page, resolved);
    const typed = await page.run(TargetScripts.typeValue(request));
    if (!typed.success) {
      watch.cancel(resolved.fp);
      return { success: false, error: typed.error };
    }
    return FieldTyper._report(page, watch, { request, resolved, typed, method, preUrl });
  }

  static async _focus(page, resolved) {
    if (resolved.occluded) return 'synthetic';
    await InputDriver.trustedClick(page.webContents, resolved.x, resolved.y);
    return 'input';
  }

  static async _report(page, watch, { request, resolved, typed, method, preUrl }) {
    const legacyWaitMs = request.submit ? FieldTyper.SUBMIT_WAIT_MS : 0;
    const { evidence } = await watch.finish({ before: resolved.fp, legacyWaitMs });
    const data = { tagName: resolved.tagName, value: String(request.text), submitted: !!typed.submitted, method };
    if (evidence) data.evidence = evidence;
    const reply = NavigationReply.build(data, preUrl, page.url());
    if (!reply.urlChanged && request.submit) data.note = 'URL did not change after submit';
    return reply;
  }
}

module.exports = FieldTyper;
