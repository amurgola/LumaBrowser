import CopyButton from '../CopyButton.js';
import RestartNotes from './RestartNotes.js';

export default class ApiPortSetting {
  static DEFAULT_PORT = 3000;

  static MAX_PORT = 65535;

  constructor({ feedback, input }) {
    this._feedback = feedback;
    this._input = input;
    this._url = document.getElementById('gsApiUrl');
    this._copy = document.getElementById('gsCopyApiUrl');
    this._status = document.getElementById('gsApiStatus');
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
    await this._loadStatus();
  }

  updateDisplay() {
    const port = this._input.value || this.savedPort;
    this._url.textContent = `http://localhost:${port}`;
  }

  async _loadStatus() {
    if (!this._status) return;
    let status = null;
    if (typeof window.electronAPI.getApiStatus === 'function') {
      try { status = await window.electronAPI.getApiStatus(); } catch (_) { status = null; }
    }
    this.renderStatus(status);
  }

  renderStatus(status) {
    if (!this._status) return;
    const problem = ApiPortSetting.problem(status);
    this._status.textContent = '';
    this._status.classList.toggle('bad', !!problem);
    this._status.hidden = !problem;
    if (!problem) return;
    this._status.appendChild(document.createTextNode(problem.text));
    if (problem.suggestedPort) this._status.appendChild(this._usePortLink(problem.suggestedPort));
  }

  static problem(status) {
    if (!status || !status.enabled || status.listening) return null;
    const port = status.port || status.configuredPort || ApiPortSetting.DEFAULT_PORT;
    const owner = status.conflict && status.conflict.owner ? ` by ${status.conflict.owner}` : ' by another program';
    const inUse = /EADDRINUSE|in use/i.test(status.error || '') || !!(status.conflict && status.conflict.kind !== 'unknown');
    const text = inUse
      ? `Not running: port ${port} is in use${owner}. Extension tabs, the Dashboard and the CLI need the local API server.`
      : `Not running: ${status.error || 'the local API server could not start'}.`;
    const suggestedPort = port < ApiPortSetting.MAX_PORT ? port + 1 : null;
    return { text, suggestedPort };
  }

  _usePortLink(port) {
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'luma-btn link gs-inline-link';
    link.textContent = `Use port ${port}`;
    link.addEventListener('click', () => {
      this._input.value = String(port);
      this._save();
    });
    return link;
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
