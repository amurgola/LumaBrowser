import ChatIcons from '../ChatIcons.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ActionButton {
  static RESTORE_MS = 2500;

  static async run(btn, call, opts) {
    if (!opts.keepEnabled) btn.disabled = true;
    let res = null;
    try { res = await call(); } catch (_) {}
    if (!res || !res.success) {
      ActionButton._showFailure(btn, (res && res.error) || opts.fallback, opts);
      return null;
    }
    if (opts.onSuccess) await opts.onSuccess(res);
    return res;
  }

  static _showFailure(btn, reason, opts) {
    if (opts.plainText) btn.textContent = reason;
    else btn.innerHTML = ChatIcons.x + HtmlEscaper.escape(reason);
    if (opts.restoreHtml == null) return;
    setTimeout(() => { btn.innerHTML = opts.restoreHtml; btn.disabled = false; }, ActionButton.RESTORE_MS);
  }
}
