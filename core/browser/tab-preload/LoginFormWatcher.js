class LoginFormWatcher {
  static TEXTUAL = new Set(['text', 'email', 'tel', '']);
  static CAPTURE_DEDUPE_MS = 3000;
  static SUBMIT_LIKE = 'button, input[type="submit"], input[type="image"], [role="button"]';
  static OTP_HINT = /one.?time|(?:^|[^a-z])otp(?:[^a-z]|$)|totp|2fa|two.?factor|mfa|verification.?code|auth(entication)?.?code|security.?code/i;
  static SUBMIT_WORDS = /\b(log ?in|sign ?in|sign ?up|register|continue|next|submit|save|create|join)\b/i;

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
    doc.addEventListener('keydown', (e) => this._onKeydown(e), true);
    this._ipc.on('vault:do-fill', (_e, data) => this.fill(data || {}));
  }


  static isPassword(el) {
    return !!el && el.tagName === 'INPUT' && String(el.type).toLowerCase() === 'password';
  }

  static isTextual(el) {
    return !!el && el.tagName === 'INPUT' && LoginFormWatcher.TEXTUAL.has(String(el.getAttribute('type') || '').toLowerCase());
  }

  static isVisible(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  scopeOf(el) {
    if (!el) return this._doc;
    if (el.tagName === 'FORM') return el;
    if (el.form) return el.form;
    return (el.closest && el.closest('form')) || this._doc;
  }

  static isSubmitLike(el) {
    const type = String(el.getAttribute('type') || '').toLowerCase();
    if (el.tagName === 'INPUT') return type === 'submit' || type === 'image';
    if (el.tagName === 'BUTTON' && (type === 'submit' || (!type && el.form))) return true;
    const label = `${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('value') || ''}`;
    return LoginFormWatcher.SUBMIT_WORDS.test(label);
  }

  passwordsIn(scope) {
    return [...scope.querySelectorAll('input')].filter((i) => LoginFormWatcher.isPassword(i) && LoginFormWatcher.isVisible(i));
  }

  usernameIn(scope, firstPassword) {
    const inputs = [...scope.querySelectorAll('input')].filter((i) => LoginFormWatcher.isTextual(i) && LoginFormWatcher.isVisible(i));
    const hinted = inputs.find((i) => /\b(username|email)\b/i.test(i.getAttribute('autocomplete') || ''));
    if (hinted) return hinted;
    if (!firstPassword) return inputs.find((i) => /user|mail|login|account|identifier/i.test(`${i.name} ${i.id} ${i.type}`)) || null;
    const before = inputs.filter((i) => i.compareDocumentPosition(firstPassword) & 4);
    return before[before.length - 1] || null;
  }

  static isNewPassword(field, passwords) {
    const hint = (field.getAttribute('autocomplete') || '').toLowerCase();
    if (hint.includes('new-password')) return true;
    if (hint.includes('current-password')) return false;
    return passwords.length >= 2;
  }

  static isOtp(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    const type = String(el.getAttribute('type') || '').toLowerCase();
    if (!['text', 'tel', 'number', ''].includes(type)) return false;
    if (String(el.getAttribute('autocomplete') || '').toLowerCase().includes('one-time-code')) return true;
    const max = Number(el.getAttribute('maxlength'));
    const hints = `${el.name || ''} ${el.id || ''} ${el.getAttribute('placeholder') || ''} ${el.getAttribute('aria-label') || ''}`;
    return LoginFormWatcher.OTP_HINT.test(hints) && (!max || (max >= 6 && max <= 8));
  }

  classify(el) {
    if (LoginFormWatcher.isOtp(el)) return 'otp';
    if (LoginFormWatcher.isPassword(el)) return 'password';
    if (!LoginFormWatcher.isTextual(el)) return null;
    const scope = this.scopeOf(el);
    const passwords = this.passwordsIn(scope);
    const user = this.usernameIn(scope, passwords[0] || null);
    if (user === el && (passwords.length || /\b(username|email)\b/i.test(el.getAttribute('autocomplete') || ''))) return 'username';
    return null;
  }


  _onFocusIn(e) {
    const el = e.target;
    const kind = this.classify(el);
    if (!kind) return;
    this._lastField = el;
    const passwords = this.passwordsIn(this.scopeOf(el));
    const r = el.getBoundingClientRect();
    this._ipc.send('vault:field-focus', {
      kind,
      newPassword: kind === 'password' && LoginFormWatcher.isNewPassword(el, passwords),
      rect: { x: r.left, y: r.top, width: r.width, height: r.height },
    });
  }

  _onFocusOut(e) {
    if (e.target !== this._lastField) return;
    setTimeout(() => {
      if (this._doc.hasFocus()) this._ipc.send('vault:field-blur');
    }, 0);
  }

  _onClick(e) {
    const target = e.target && e.target.closest ? e.target.closest(LoginFormWatcher.SUBMIT_LIKE) : null;
    if (target && LoginFormWatcher.isSubmitLike(target)) this._capture(target);
  }

  _onKeydown(e) {
    if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT') this._capture(e.target);
  }

  _capture(origin) {
    if (!origin) return;
    const scope = this.scopeOf(origin);
    const passwords = this.passwordsIn(scope).filter((p) => p.value);
    const user = this.usernameIn(scope, passwords[0] || null);
    const username = user ? user.value : '';
    const password = passwords.length ? passwords[passwords.length - 1].value : '';
    if (!password && !username) return;
    if (!password && !user) return;
    const key = `${username}\u0000${password}`;
    const now = Date.now();
    if (key === this._lastCapture.key && now - this._lastCapture.at < LoginFormWatcher.CAPTURE_DEDUPE_MS) return;
    this._lastCapture = { key, at: now };
    this._ipc.send('vault:capture', { username, password });
  }


  fill(data) {
    const anchor = this._lastField && this._lastField.isConnected ? this._lastField : this._doc.activeElement;
    if (data.otp != null) {
      const target = LoginFormWatcher.isOtp(anchor) ? anchor : [...this.scopeOf(anchor).querySelectorAll('input')].find((i) => LoginFormWatcher.isOtp(i));
      if (target) LoginFormWatcher.setValue(target, String(data.otp));
      return;
    }
    const scope = this.scopeOf(anchor);
    const passwords = this.passwordsIn(scope);
    if (data.generated) {
      const targets = passwords.filter((p) => !p.value || LoginFormWatcher.isNewPassword(p, passwords));
      for (const p of (targets.length ? targets : passwords)) LoginFormWatcher.setValue(p, data.password);
      return;
    }
    const user = this.usernameIn(scope, passwords[0] || null);
    if (user && data.username != null) LoginFormWatcher.setValue(user, data.username);
    if (passwords[0] && data.password != null) LoginFormWatcher.setValue(passwords[0], data.password);
  }

  static setValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
    if (setter && setter.set) setter.set.call(el, value); else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

module.exports = LoginFormWatcher;
