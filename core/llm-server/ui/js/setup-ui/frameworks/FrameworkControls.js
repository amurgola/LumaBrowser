import FrameworkOptionRows from './FrameworkOptionRows.js';

export default class FrameworkControls {
  constructor(ctx, card) {
    this._ctx = ctx;
    this._card = card;
  }

  wire(body) {
    const api = this._ctx.api || {};
    FrameworkControls._each(body, '[data-fw-active-build]', (el) => this._save(true,
      () => api.setActiveBuild(el.getAttribute('data-fw-active-build'), el.value || null)));
    FrameworkControls._each(body, '[data-format-framework]', (el) => this._save(true,
      () => api.setFormatFramework(el.getAttribute('data-format-framework'), el.value || null)));
    FrameworkControls._each(body, '[data-fw-option]', (el) => {
      const { frameworkId, optionId } = FrameworkControls.optionOf(el);
      return this._save(false, () => api.setFrameworkOption(frameworkId, optionId, FrameworkControls.valueOf(el)));
    });
  }

  static optionOf(el) {
    const tag = el.getAttribute('data-fw-option') || '';
    const cut = tag.lastIndexOf(':');
    return { frameworkId: tag.slice(0, cut), optionId: tag.slice(cut + 1) };
  }

  static valueOf(el) {
    const kind = el.getAttribute('data-fw-value');
    const VALUE = FrameworkOptionRows.VALUE;
    if (kind === VALUE.BOOL) return !!el.checked;
    if (kind === VALUE.NOT) return !el.checked;
    if (kind === VALUE.NUMBER) return Number(el.value) || 1;
    if (kind === VALUE.OPTIONAL) return el.value || null;
    return el.value;
  }

  static _each(body, selector, onChange) {
    body.querySelectorAll(selector).forEach((el) => el.addEventListener('change', () => onChange(el)));
  }

  async _save(selection, call) {
    let res = null;
    try { res = await call(); } catch (_) { res = null; }
    if (res && res.success) this._ctx.frameworks.setView(res.view);
    this._card.afterFrameworkSave(!!(res && res.success), !!(res && res.serverStopped), selection);
  }
}
