export default class SettingsFeedback {
  static SAVED_MS = 1400;

  static FAILED_MS = 3200;

  static TOAST_OK_MS = 3500;

  static TOAST_BAD_MS = 7000;

  constructor({ log }) {
    this._log = log;
  }

  markSaved(control, ok = true, errorMessage = '') {
    if (!control) return;
    const row = control.closest ? (control.closest('.gs-row') || control.parentElement) : control.parentElement;
    if (!row) return;
    SettingsFeedback.flashBadge(SettingsFeedback._badgeIn(row), ok);
    SettingsFeedback._syncRowError(row, ok, errorMessage);
  }

  static flashBadge(badge, ok = true) {
    badge.textContent = ok ? 'Saved' : 'Failed';
    badge.classList.toggle('is-err', !ok);
    badge.classList.add('is-on');
    clearTimeout(badge._t);
    badge._t = setTimeout(() => badge.classList.remove('is-on'), ok ? SettingsFeedback.SAVED_MS : SettingsFeedback.FAILED_MS);
  }

  toast(message, kind = 'ok', opts = {}) {
    const el = document.getElementById('settingsToast');
    if (!el) {
      this._log.add(message, kind === 'bad' ? 'error' : 'success');
      return;
    }
    el.className = `settings-toast ${kind}`;
    el.innerHTML = '';
    el.append(SettingsFeedback._dot(kind), SettingsFeedback._text(message), this._dismissButton());
    el.hidden = false;
    clearTimeout(el._t);
    const ttl = opts.sticky ? 0 : (kind === 'bad' ? SettingsFeedback.TOAST_BAD_MS : SettingsFeedback.TOAST_OK_MS);
    if (ttl) el._t = setTimeout(() => this.hideToast(), ttl);
  }

  hideToast() {
    const el = document.getElementById('settingsToast');
    if (!el) return;
    clearTimeout(el._t);
    el.hidden = true;
  }

  static _badgeIn(row) {
    let badge = row.querySelector(':scope > .gs-saved');
    if (badge) return badge;
    badge = document.createElement('span');
    badge.className = 'gs-saved';
    const label = row.querySelector(':scope > .gs-row-label');
    if (label && label.nextSibling) row.insertBefore(badge, label.nextSibling);
    else row.appendChild(badge);
    return badge;
  }

  static _syncRowError(row, ok, errorMessage) {
    let err = row.querySelector(':scope > .gs-row-error');
    if (!ok && errorMessage) {
      if (!err) {
        err = document.createElement('div');
        err.className = 'gs-row-error';
        row.appendChild(err);
        row.style.flexWrap = 'wrap';
      }
      err.textContent = errorMessage;
    } else if (err) {
      err.remove();
    }
  }

  static _dot(kind) {
    const dot = document.createElement('span');
    dot.className = `luma-dot ${kind === 'bad' ? 'bad' : 'ok'}`;
    return dot;
  }

  static _text(message) {
    const text = document.createElement('span');
    text.className = 'settings-toast-text';
    text.textContent = message;
    return text;
  }

  _dismissButton() {
    const x = document.createElement('button');
    x.className = 'settings-toast-x';
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = 'x';
    x.addEventListener('click', () => this.hideToast());
    return x;
  }
}
