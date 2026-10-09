import SettingToggle from './SettingToggle.js';

export default class CliShimSwitch {
  constructor({ feedback }) {
    this._feedback = feedback;
    this._el = document.getElementById('gsCliShim');
    this._help = document.getElementById('gsCliShimHelp');
    this._defaultHelp = this._help ? this._help.innerHTML : '';
  }

  install() {
    SettingToggle.wire(this._el, (v) => this._write(v), this._feedback, () => this.load());
  }

  async load() {
    if (!this._el) return;
    try {
      const s = await window.ipcBridge.invoke('core.settings.cliShim.status');
      if (!s || s.success === false) this._showUnavailable(s);
      else this._showStatus(s);
    } catch (_) {}
  }

  async _write(v) {
    this._el.disabled = true;
    if (this._help) this._help.textContent = v ? 'Installing the luma command…' : 'Removing the luma command…';
    try {
      const r = await window.ipcBridge.invoke(v ? 'core.settings.cliShim.install' : 'core.settings.cliShim.uninstall');
      if (r && r.success !== false && v) this._feedback.toast(CliShimSwitch.installedMessage(r));
      return r;
    } finally { this._el.disabled = false; }
  }

  static installedMessage(r) {
    return r.onPath ? 'luma is ready. Open a new terminal and type luma.' : `luma installed at ${r.shimPath}. ${r.note || ''}`.trim();
  }

  _showUnavailable(s) {
    this._el.checked = false;
    this._el.disabled = true;
    if (this._help) this._help.textContent = (s && s.error) || 'Not available in this build.';
  }

  _showStatus(s) {
    this._el.disabled = false;
    this._el.checked = !!s.installed;
    if (!this._help) return;
    if (s.installed) this._help.textContent = `${s.note ? `${s.note} ` : ''}Launcher: ${s.shimPath}`;
    else this._help.innerHTML = this._defaultHelp;
  }
}
