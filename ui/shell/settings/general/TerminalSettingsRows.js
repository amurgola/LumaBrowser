import SettingToggle from './SettingToggle.js';

export default class TerminalSettingsRows {
  constructor({ feedback }) {
    this._feedback = feedback;
    this._agent = document.getElementById('gsTerminalAgent');
    this._profile = document.getElementById('gsTerminalProfile');
  }

  install() {
    SettingToggle.wire(this._agent, (on) => this._save({ agentAccess: on }), this._feedback);
    if (this._profile) this._profile.addEventListener('change', () => this._saveProfile());
  }

  async load() {
    if (!this._agent || !this._profile) return;
    try {
      const [settings, profiles] = await Promise.all([
        window.ipcBridge.invoke('core.terminal.settings'),
        window.ipcBridge.invoke('core.terminal.profiles'),
      ]);
      if (!settings) return;
      this._agent.checked = !!settings.agentAccess;
      this._fillProfiles(profiles || [], settings.defaultProfile);
    } catch (_) {}
  }

  _fillProfiles(profiles, chosen) {
    this._profile.textContent = '';
    for (const profile of profiles.filter((p) => p.kind === 'shell')) {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.label;
      this._profile.appendChild(option);
    }
    if (chosen) this._profile.value = chosen;
  }

  async _saveProfile() {
    const result = await this._save({ defaultProfile: this._profile.value }).catch((e) => ({ success: false, error: e.message }));
    const ok = !!result && result.success !== false;
    this._feedback.markSaved(this._profile, ok, ok ? undefined : 'Could not save this setting');
  }

  _save(patch) {
    return window.ipcBridge.invoke('core.terminal.setSettings', patch);
  }
}
