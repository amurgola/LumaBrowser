import Clipboard from '../../dom/Clipboard.js';
import StatusLine from '../StatusLine.js';

export default class HostFixActions {
  static RECOVER_REPROBE_MS = 3000;

  static ASPM_REPROBE_MS = 1500;

  static COPIED_MS = 1500;

  constructor({ api, reload }) {
    this._api = api;
    this._reload = reload;
  }

  async recoverGpu(button) {
    const instanceId = button.dataset.recoverGpu;
    const container = button.closest('.gpu-health-actions');
    const status = StatusLine.for(container && container.querySelector('[data-recover-status]'), 'gpu-health-status');
    if (!instanceId) { status('bad', 'Missing device instance ID.'); return; }
    if (!this._api || !this._api.recoverDisplayDevice) { status('bad', 'recoverDisplayDevice is unavailable.'); return; }
    button.disabled = true;
    status('working', 'Approve the Windows admin prompt. Recovery then escalates (device → PCIe port) and can take up to a minute: don\'t click again.');
    await this._attempt(button, status, () => this._api.recoverDisplayDevice(instanceId), 'Recovery failed.', (res) => {
      status('ok', `Recovered via ${res.method || 'device restart'}: re-probing…`);
      setTimeout(() => this._reload(), HostFixActions.RECOVER_REPROBE_MS);
    });
  }

  async setAspmOff(button) {
    const container = button.closest('.gph-aspm');
    const status = StatusLine.for(container && container.querySelector('[data-aspm-status]'), 'gpu-health-status');
    if (!this._api || !this._api.setPcieAspmOff) { status('bad', 'setPcieAspmOff is unavailable.'); return; }
    button.disabled = true;
    status('working', 'Applying…');
    await this._attempt(button, status, () => this._api.setPcieAspmOff(), 'Could not change the power setting.', () => {
      status('ok', 'PCIe link power saving disabled. This persists across reboots: re-probing…');
      setTimeout(() => this._reload(), HostFixActions.ASPM_REPROBE_MS);
    });
  }

  async applyPathFix(button) {
    const dir = button.dataset.dir;
    const container = button.closest('[data-path-hint]');
    const status = StatusLine.for(container && container.querySelector('[data-fix-status]'), 'path-hint-status');
    if (!dir) { status('bad', 'Missing target directory.'); return; }
    if (!this._api || !this._api.addNvidiaSmiToPath) { status('bad', 'llmDiagAPI.addNvidiaSmiToPath is unavailable.'); return; }
    button.disabled = true;
    status('', 'Updating user PATH…');
    await this._attempt(button, status, () => this._api.addNvidiaSmiToPath(dir), 'PATH update failed.', (res) => this._pathFixed(res, button, status));
  }

  async copyCommand(button) {
    const container = button.closest('[data-path-hint]');
    const pre = container && container.querySelector('pre');
    if (!pre) return;
    const ok = await Clipboard.copyText(pre.textContent);
    const original = button.textContent;
    button.textContent = ok ? 'Copied' : 'Copy failed';
    setTimeout(() => { button.textContent = original; }, HostFixActions.COPIED_MS);
  }

  dismissPathHint() {
    if (this._api && this._api.dismissNvidiaSmiPathHint) this._api.dismissNvidiaSmiPathHint().then(() => this._reload());
  }

  async _pathFixed(res, button, status) {
    if (res.status === 'already-present') {
      status('ok', 'PATH already contains the nvidia-smi directory. The diagnostic still showed up because this Electron process didn\'t inherit PATH correctly from Windows: we can\'t fix that from PowerShell, but the cached absolute path keeps everything working. Click "Don\'t show again" to stop the banner.');
      button.disabled = false;
      return;
    }
    status('ok', 'Added to user PATH: re-probing…');
    await this._reload();
  }

  async _attempt(button, status, call, failure, onSuccess) {
    try {
      const res = await call();
      if (!res || !res.success) {
        status('bad', (res && res.error) || failure);
        button.disabled = false;
        return;
      }
      await onSuccess(res);
    } catch (err) {
      status('bad', err.message || 'Unexpected failure');
      button.disabled = false;
    }
  }
}
