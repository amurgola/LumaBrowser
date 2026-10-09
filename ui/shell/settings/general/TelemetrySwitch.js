import SettingToggle from './SettingToggle.js';

export default class TelemetrySwitch {
  static HELP = 'A once-a-day version and platform ping to lumabyte.com. Nothing you browse or type is sent.';

  static DEV_HELP = 'Always off in a development build.';

  constructor({ feedback }) {
    this._feedback = feedback;
    this._el = document.getElementById('gsTelemetryEnabled');
    this._help = document.getElementById('gsTelemetryHelp');
  }

  install() {
    SettingToggle.wire(this._el, (v) => window.electronAPI.setTelemetryOptOut(!v), this._feedback, () => this.load());
  }

  async load() {
    const api = window.electronAPI;
    if (!this._el || !api || !api.getTelemetryStatus) return;
    try {
      this.apply(await api.getTelemetryStatus());
    } catch (_) {}
  }

  apply(status) {
    this._el.checked = !!status.allowed;
    this._el.disabled = !!status.developerMode;
    if (this._help) this._help.textContent = status.developerMode ? TelemetrySwitch.DEV_HELP : TelemetrySwitch.HELP;
  }
}
