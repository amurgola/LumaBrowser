import CopyButton from '../CopyButton.js';
import RestartNotes from './RestartNotes.js';

export default class ApiPortSetting {
  static DEFAULT_PORT = 3000;

  constructor({ feedback, input }) {
    this._feedback = feedback;
    this._input = input;
    this._url = document.getElementById('gsApiUrl');
    this._copy = document.getElementById('gsCopyApiUrl');
    this.savedPort = ApiPortSetting.DEFAULT_PORT;
  }

  install() {
    this._input.addEventListener('change', () => this._save());
    this._input.addEventListener('input', () => this.updateDisplay());
    this._copy.addEventListener('click', () => CopyButton.copy(this._copy, this._url.textContent));
  }

  async load() {
    this.savedPort = await window.electronAPI.getApiPort();
    this._input.value = this.savedPort;
    this.updateDisplay();
  }

  updateDisplay() {
    const port = this._input.value || this.savedPort;
    this._url.textContent = `http://localhost:${port}`;
  }

  async _save() {
    const result = await window.electronAPI.setApiPort(parseInt(this._input.value, 10));
    if (result.success) {
      RestartNotes.show('gsPortRestartNote');
      this.updateDisplay();
      this._feedback.markSaved(this._input, true);
    } else {
      this._feedback.markSaved(this._input, false, result.error || 'Invalid port');
      this._input.value = this.savedPort;
    }
  }
}
