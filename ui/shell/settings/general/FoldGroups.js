export default class FoldGroups {
  static STORE_PREFIX = 'gs.fold.';

  constructor({ doc = document, storage = null } = {}) {
    this._doc = doc;
    this._storage = storage;
  }

  static keyFor(key) {
    return `${FoldGroups.STORE_PREFIX}${key}`;
  }

  install() {
    this._doc.querySelectorAll('details[data-gs-fold]').forEach((details) => this._wire(details));
  }

  static summarize(key, text, { attention = false } = {}, doc = document) {
    const details = doc.querySelector(`details[data-gs-fold="${key}"]`);
    if (!details) return null;
    const summary = details.querySelector('[data-gs-fold-summary]');
    if (summary) summary.textContent = text || '';
    details.classList.toggle('attention', !!attention);
    if (attention && !details.open) details.open = true;
    return details;
  }

  static setAction(key, action, doc = document) {
    const btn = doc.querySelector(`details[data-gs-fold="${key}"] [data-gs-fold-action]`);
    if (!btn) return null;
    btn.hidden = !action;
    if (action) {
      btn.textContent = action.label;
      btn.disabled = !!action.disabled;
    }
    return btn;
  }

  static onAction(key, handler, doc = document) {
    const btn = doc.querySelector(`details[data-gs-fold="${key}"] [data-gs-fold-action]`);
    if (!btn) return false;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler(e);
    });
    return true;
  }

  _wire(details) {
    const key = details.dataset.gsFold;
    const stored = this._read(key);
    if (stored !== null) details.open = stored;
    const summary = details.querySelector('summary');
    if (!summary) return;
    summary.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      this._write(key, !details.open);
    });
  }

  _store() {
    if (this._storage) return this._storage;
    try { return this._doc.defaultView.localStorage; } catch (_) { return null; }
  }

  _read(key) {
    try {
      const v = this._store().getItem(FoldGroups.keyFor(key));
      return v === null || v === undefined ? null : v === '1';
    } catch (_) { return null; }
  }

  _write(key, open) {
    try { this._store().setItem(FoldGroups.keyFor(key), open ? '1' : '0'); } catch (_) {}
  }
}
