import Notice from '../../../core/llm-server/ui/js/notice/Notice.js';

export default class SettingsFeedback {
  static SAVED_MS = 1400;

  static FAILED_MS = 3200;

  static TOAST_OK_MS = 3500;

  static TOAST_ACTION_MS = 8000;

  static BAD_KINDS = ['bad', 'error'];

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
    const bad = SettingsFeedback.isBad(kind);
    const action = SettingsFeedback._action(opts);
    const el = document.getElementById('settingsToast');
    if (!SettingsFeedback._onScreen(el)) {
      this._log.add(message, bad ? 'error' : 'success', ...(action ? [{ action }] : []));
      return;
    }
    el.className = `settings-toast luma-toast ${bad ? 'bad' : 'ok'}`;
    el.setAttribute('role', bad ? 'alert' : 'status');
    el.setAttribute('aria-live', bad ? 'assertive' : 'polite');
    el.replaceChildren(SettingsFeedback._text(message), this._controls(action));
    el.hidden = false;
    clearTimeout(el._t);
    const ttl = SettingsFeedback.ttl(bad, !!action, !!opts.sticky);
    if (ttl) el._t = setTimeout(() => this.hideToast(), ttl);
  }

  static isBad(kind) {
    return SettingsFeedback.BAD_KINDS.includes(kind);
  }

  static ttl(bad, hasAction, sticky) {
    if (bad || sticky) return 0;
    return hasAction ? SettingsFeedback.TOAST_ACTION_MS : SettingsFeedback.TOAST_OK_MS;
  }

  hideToast() {
    const el = document.getElementById('settingsToast');
    if (!el) return;
    clearTimeout(el._t);
    el.hidden = true;
  }

  static _badgeIn(row) {
    let badge = row.querySelector(':scope > .gs-saved, :scope > .gs-row-text > .gs-saved');
    if (badge) return badge;
    badge = document.createElement('span');
    badge.className = 'gs-saved';
    const label = row.querySelector(':scope > .gs-row-label, :scope > .gs-row-text > .gs-row-label');
    if (label) label.after(badge);
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

  static _onScreen(el) {
    if (!el) return false;
    const modal = el.closest('#settingsModal');
    return !modal || modal.classList.contains('active');
  }

  static _action(opts) {
    const action = opts && opts.action;
    return action && typeof action.run === 'function' ? action : null;
  }

  static _text(message) {
    const text = document.createElement('span');
    text.className = 'settings-toast-text luma-toast-text';
    text.textContent = message;
    return text;
  }

  _controls(action) {
    const used = action ? { label: action.label, run: () => { this.hideToast(); action.run(); } } : null;
    return Notice.controls(used, () => this.hideToast());
  }
}
