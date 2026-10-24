import DesktopSettingsTab from './DesktopSettingsTab.js';
import SpeechPlayer from './SpeechPlayer.js';

export default class DesktopRenderer {
  constructor({ tab = null, player = null } = {}) {
    this._tab = tab || new DesktopSettingsTab();
    this._player = player || new SpeechPlayer();
    this._active = false;
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    this._player.activate(context && context.ipcBridge);
    await this._tab.activate(context);
  }

  deactivate() {
    this._player.deactivate();
    this._tab.deactivate();
    this._active = false;
  }
}
