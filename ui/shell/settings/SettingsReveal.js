export default class SettingsReveal {
  static HIGHLIGHT_CLASS = 'gs-reveal';
  static HIGHLIGHT_MS = 2600;
  static FIND_TRIES = 40;
  static ROW_SELECTOR = '.gs-row, .luma-field, .form-group, .gs-vault-field, .defaults-row';
  static GROUP_SELECTOR = '.gs-subsection, .settings-section';

  constructor({ settings, getSlotManager, doc = document }) {
    this._settings = settings;
    this._getSlots = getSlotManager;
    this._doc = doc;
    this._timer = null;
  }

  async reveal(target) {
    if (!target || typeof target !== 'object') return null;
    if (target.surface === 'extension') return this._extension(target.extensionId);
    const tab = target.tab || 'general';
    this._settings.open(tab);
    if (target.subtab) this._subtab(tab, target.subtab);
    if (!target.selector) return null;
    const el = await this._find(target.selector);
    if (!el) return null;
    this.expandAround(el);
    return this.highlight(SettingsReveal.visibleRow(el));
  }

  _extension(extensionId) {
    this._settings.open('extensions');
    const slots = this._getSlots();
    if (slots && typeof slots.showExtensionSettings === 'function' && extensionId) slots.showExtensionSettings(String(extensionId));
    return null;
  }

  _subtab(tab, subtab) {
    const slots = this._getSlots();
    if (slots && typeof slots.switchSettingsSubtab === 'function') slots.switchSettingsSubtab(tab, subtab);
  }

  _find(selector) {
    return new Promise((resolve) => {
      const attempt = (left) => {
        let el = null;
        try { el = this._doc.querySelector(selector); } catch (_) { resolve(null); return; }
        if (el) { resolve(el); return; }
        if (left <= 0) { resolve(null); return; }
        setTimeout(() => attempt(left - 1), 25);
      };
      attempt(SettingsReveal.FIND_TRIES);
    });
  }

  expandAround(el) {
    for (let node = el; node && node !== this._doc.body; node = node.parentElement) {
      if (node.tagName === 'DETAILS' && !node.open) node.open = true;
    }
  }

  static visibleRow(el) {
    const section = el.matches && el.matches('.gs-subsection-title, .gs-group-desc') ? el.closest('.gs-subsection') : null;
    const row = section || (el.closest && el.closest(SettingsReveal.ROW_SELECTOR)) || el;
    if (SettingsReveal.isShown(row)) return row;
    let node = row.parentElement;
    while (node && !SettingsReveal.isShown(node)) node = node.parentElement;
    return (node && node.closest && node.closest(SettingsReveal.GROUP_SELECTOR)) || node || row;
  }

  static isShown(el) {
    if (!el || el.hidden) return false;
    const style = el.ownerDocument.defaultView.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  highlight(el) {
    const cls = SettingsReveal.HIGHLIGHT_CLASS;
    for (const old of this._doc.querySelectorAll(`.${cls}`)) old.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const control = el.matches('input, select, textarea, button') ? el : el.querySelector('input:not([type=hidden]), select, textarea');
    if (control && typeof control.focus === 'function') control.focus({ preventScroll: true });
    clearTimeout(this._timer);
    this._timer = setTimeout(() => el.classList.remove(cls), SettingsReveal.HIGHLIGHT_MS);
    return el;
  }
}
