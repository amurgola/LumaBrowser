export default class ShellHooks {
  constructor(hooks) {
    this._hooks = hooks || {};
  }

  toast(message, kind = 'ok') {
    const toast = this._fn('toast', 'settingsToast');
    if (toast) return toast(message, kind);
    if (typeof window.addLogEntry === 'function') return window.addLogEntry(message, kind === 'bad' ? 'error' : 'success');
    return console[kind === 'bad' ? 'error' : 'log'](message);
  }

  markSaved(control, ok, errorMessage) {
    const mark = this._fn('markSaved', 'gsMarkSaved');
    if (mark) mark(control, ok, errorMessage);
  }

  closeSettings() {
    const close = this._fn('closeSettings', 'closeSettings');
    if (close) close();
    else ShellHooks.hideSettingsModal();
  }

  rerunSetupWizard() {
    const rerun = this._fn('rerunSetupWizard', '__rerunSetupWizard');
    if (rerun) rerun();
  }

  static hideSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
  }

  _fn(name, legacyGlobal) {
    if (typeof this._hooks[name] === 'function') return this._hooks[name];
    return typeof window[legacyGlobal] === 'function' ? window[legacyGlobal] : null;
  }
}
