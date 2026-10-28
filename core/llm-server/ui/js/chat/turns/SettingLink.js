import ModelTunePanel from '../composer/ModelTunePanel.js';

export default class SettingLink {
  static OUTLINE_CLASS = 'cm-setting-hl';
  static OUTLINE_MS = 6000;
  static FIND_TRIES = 30;

  static TUNE_LABELS = {
    agentTimeoutMinutes: 'Edit run timeout',
    agentMaxIterations: 'Edit run steps',
    maxParallelToolCalls: 'Edit parallel tools',
    maxReplyTokens: 'Edit reply limit',
    reasoningEffort: 'Edit thinking',
    temperature: 'Edit temperature',
  };

  constructor(ctx) {
    this._ctx = ctx;
  }

  available(target) {
    if (!target || typeof target !== 'object') return false;
    if (target.tune) return ModelTunePanel.available(this._ctx.api) && !!this._ctx.state.modelRef;
    return !!target.setup;
  }

  static label(target) {
    if (target && target.label) return String(target.label);
    if (target && target.tune) return SettingLink.TUNE_LABELS[target.tune] || 'Edit setting';
    return 'Open Setup';
  }

  open(target) {
    if (!this.available(target)) return;
    if (target.tune) this._openTune(target.tune);
    else this._openSetup(target.setup, target.selector);
  }

  _openTune(fieldId) {
    const { state } = this._ctx;
    const ref = state.modelRef;
    const hit = (state.models || []).find((m) => m.ref === ref);
    new ModelTunePanel(this._ctx).open(ref, hit ? hit.label : ref, { highlight: fieldId });
  }

  _openSetup(page, selector) {
    this._ctx.composer.openSetup(page);
    if (selector) SettingLink.outline(document, selector);
  }

  static outline(doc, selector, tries = SettingLink.FIND_TRIES) {
    return new Promise((resolve) => {
      const attempt = (left) => {
        const el = doc.querySelector(selector);
        if (el) { SettingLink.flash(el); resolve(el); return; }
        if (left <= 0) { resolve(null); return; }
        SettingLink._nextFrame(() => attempt(left - 1));
      };
      attempt(tries);
    });
  }

  static flash(el) {
    el.classList.add(SettingLink.OUTLINE_CLASS);
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const control = el.matches('input, select, textarea, button') ? el : el.querySelector('input, select, textarea, button');
    if (control && typeof control.focus === 'function') control.focus({ preventScroll: true });
    setTimeout(() => el.classList.remove(SettingLink.OUTLINE_CLASS), SettingLink.OUTLINE_MS);
  }

  static _nextFrame(fn) {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn);
    else setTimeout(fn, 16);
  }
}
