import SettingToggle from './SettingToggle.js';

export default class PromptApiSwitch {
  constructor({ feedback }) {
    this._feedback = feedback;
    this._el = document.getElementById('gsPromptApiEnabled');
  }

  install() {
    SettingToggle.wire(this._el, (enabled) => window.electronAPI.setPromptApiEnabled(enabled), this._feedback, () => this.load());
  }

  async load() {
    const api = window.electronAPI;
    if (!this._el || !api || !api.getPromptApiStatus) return;
    try {
      this.apply(await api.getPromptApiStatus());
    } catch (_) {}
  }

  apply(status) {
    this._el.checked = !!(status && status.enabled);
  }
}
