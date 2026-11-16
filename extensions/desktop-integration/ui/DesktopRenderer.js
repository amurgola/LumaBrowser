import DesktopSettingsTab from './DesktopSettingsTab.js';
import DictationRecorder from './DictationRecorder.js';
import DictationShortcutRow from './DictationShortcutRow.js';
import SpeechPlayer from './SpeechPlayer.js';

export default class DesktopRenderer {
  constructor({ tab = null, player = null, recorder = null, dictationRow = null } = {}) {
    this._tab = tab || new DesktopSettingsTab();
    this._player = player || new SpeechPlayer();
    this._recorder = recorder || new DictationRecorder();
    this._dictationRow = dictationRow || new DictationShortcutRow();
    this._active = false;
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    const ipc = context && context.ipcBridge;
    this._player.activate(ipc);
    this._recorder.activate(ipc);
    this._dictationRow.activate(ipc);
    await this._tab.activate(context);
  }

  deactivate() {
    this._player.deactivate();
    this._recorder.deactivate();
    this._dictationRow.deactivate();
    this._tab.deactivate();
    this._active = false;
  }
}
