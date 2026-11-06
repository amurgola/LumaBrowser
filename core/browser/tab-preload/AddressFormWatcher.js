const AutofillFields = require('../../vault/AutofillFields');

class AddressFormWatcher {
  static MIN_FIELDS = 3;
  static CAPTURE_DEDUPE_MS = 3000;
  static SUBMIT_LIKE = 'button, input[type="submit"], [role="button"]';

  constructor(ipcRenderer, win) {
    this._ipc = ipcRenderer;
    this._window = win;
    this._doc = win.document;
    this._lastField = null;
    this._lastCapture = { key: '', at: 0 };
  }

  install() {
    if (!/^https?:$/.test(this._window.location.protocol)) return;
    const doc = this._doc;
    doc.addEventListener('focusin', (e) => this._onFocusIn(e), true);
    doc.addEventListener('focusout', (e) => this._onFocusOut(e), true);
    doc.addEventListener('submit', (e) => this._capture(e.target), true);
    doc.addEventListener('click', (e) => this._onClick(e), true);
    this._ipc.on('vault:do-fill-profile', (_e, data) => this.fill(data && data.profile));
  }


  labelOf(el) {
    const parts = [el.getAttribute('aria-label') || ''];
    if (el.id) {
      const forLabel = this._doc.querySelector(`label[for="${AddressFormWatcher._cssEscape(el.id)}"]`);
      if (forLabel) parts.push(forLabel.textContent || '');
    }
    const wrap = el.closest && el.closest('label');
    if (wrap) parts.push(wrap.textContent || '');
    return parts.join(' ').trim();
  }

  static _cssEscape(id) {
    return String(id).replace(/["\\]/g, '\\$&');
  }

  keyOf(el) {
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA')) return null;
    return AutofillFields.classify({
      tag: el.tagName, type: el.getAttribute('type') || '', autocomplete: el.getAttribute('autocomplete') || '',
      name: el.getAttribute('name') || '', id: el.id || '', placeholder: el.getAttribute('placeholder') || '', label: this.labelOf(el),
    });
  }

  scopeOf(el) {
    if (!el) return this._doc;
    if (el.tagName === 'FORM') return el;
    if (el.form) return el.form;
    return (el.closest && el.closest('form')) || this._doc;
  }

  fieldsIn(scope) {
    const out = [];
    for (const el of scope.querySelectorAll('input, select, textarea')) {
      if (el.disabled || el.readOnly) continue;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const key = this.keyOf(el);
      if (key) out.push({ el, key });
    }
    return out;
  }

  isAddressScope(scope) {
    if (scope.querySelector('input[type="password"]')) return false;
    return new Set(this.fieldsIn(scope).map((f) => f.key)).size >= AddressFormWatcher.MIN_FIELDS;
  }


  _onFocusIn(e) {
    const el = e.target;
    if (!this.keyOf(el) || !this.isAddressScope(this.scopeOf(el))) return;
    this._lastField = el;
    const r = el.getBoundingClientRect();
    this._ipc.send('vault:profile-focus', { rect: { x: r.left, y: r.top, width: r.width, height: r.height } });
  }

  _onFocusOut(e) {
    if (e.target !== this._lastField) return;
    setTimeout(() => {
      if (this._doc.hasFocus()) this._ipc.send('vault:field-blur');
    }, 0);
  }

  _onClick(e) {
    const target = e.target && e.target.closest ? e.target.closest(AddressFormWatcher.SUBMIT_LIKE) : null;
    if (!target) return;
    const type = String(target.getAttribute('type') || '').toLowerCase();
    if (type === 'submit' || (target.tagName === 'BUTTON' && !type && target.form)) this._capture(target);
  }

  _capture(origin) {
    const scope = this.scopeOf(origin);
    if (!this.isAddressScope(scope)) return;
    const fields = {};
    for (const { el, key } of this.fieldsIn(scope)) {
      const value = AddressFormWatcher.valueOf(el);
      if (value && !fields[key]) fields[key] = value;
    }
    if (!AutofillFields.isWorthSaving(fields)) return;
    const k = JSON.stringify(fields);
    const now = Date.now();
    if (k === this._lastCapture.key && now - this._lastCapture.at < AddressFormWatcher.CAPTURE_DEDUPE_MS) return;
    this._lastCapture = { key: k, at: now };
    this._ipc.send('vault:profile-capture', { fields });
  }

  static valueOf(el) {
    if (el.tagName === 'SELECT') {
      const opt = el.options[el.selectedIndex];
      return opt && opt.value ? String(opt.textContent || opt.value).trim() : '';
    }
    return String(el.value || '').trim();
  }


  fill(profile) {
    if (!profile) return;
    const anchor = this._lastField && this._lastField.isConnected ? this._lastField : this._doc.activeElement;
    for (const { el, key } of this.fieldsIn(this.scopeOf(anchor))) {
      const value = AutofillFields.valueFor(profile, key);
      if (!value) continue;
      if (el.tagName === 'SELECT') AddressFormWatcher.selectOption(el, value);
      else AddressFormWatcher.setValue(el, value);
    }
  }

  static selectOption(el, value) {
    const want = value.toLowerCase();
    const opt = [...el.options].find((o) => o.value.toLowerCase() === want || String(o.textContent).trim().toLowerCase() === want);
    if (!opt) return;
    el.value = opt.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  static setValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
    if (setter && setter.set) setter.set.call(el, value); else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

module.exports = AddressFormWatcher;
