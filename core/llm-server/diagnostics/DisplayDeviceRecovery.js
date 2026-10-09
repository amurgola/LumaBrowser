const fs = require('fs');
const os = require('os');
const path = require('path');
const PowerShellRunner = require('./PowerShellRunner');
const PowerShellJson = require('./PowerShellJson');
const PnpDisplayDevices = require('./PnpDisplayDevices');
const DisplayRecoveryScripts = require('./DisplayRecoveryScripts');

class DisplayDeviceRecovery {
  static INSTANCE_ID = /^[A-Za-z0-9\\&._{}-]{4,512}$/;

  static TIMEOUT_MS = 180000;

  static recover(instanceId) {
    return new DisplayDeviceRecovery(instanceId).recover();
  }

  constructor(instanceId) {
    this._instanceId = instanceId;
    this._resultPath = path.join(os.tmpdir(), `lb-gpu-recover-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  }

  async recover() {
    const invalid = this._validateInput() || await this._validateTarget();
    if (invalid) return { success: false, error: invalid };
    try {
      const result = await this._runElevated();
      return DisplayDeviceRecovery.interpret(result, await this._readVerdict());
    } finally {
      fs.promises.unlink(this._resultPath).catch(() => {});
    }
  }

  static interpret(result, verdict) {
    if (!result || !result.ok) return { success: false, error: DisplayDeviceRecovery._launchError(result) };
    const exitCode = DisplayDeviceRecovery._exitCode(result.stdout);
    const ok = verdict ? !!verdict.ok : exitCode === 0;
    if (ok) {
      return {
        success: true,
        method: (verdict && verdict.method) || 'device restart',
        message: (verdict && verdict.message) || 'Display adapter restarted.',
      };
    }
    return {
      success: false,
      error: (verdict && verdict.message) || `Recovery script exited with code ${exitCode == null ? 'unknown' : exitCode}.`,
    };
  }

  _validateInput() {
    if (process.platform !== 'win32') return 'Only implemented on Windows.';
    const id = this._instanceId;
    if (!id || typeof id !== 'string' || !DisplayDeviceRecovery.INSTANCE_ID.test(id) || !id.includes('\\')) {
      return 'Invalid Plug-and-Play instance ID.';
    }
    return null;
  }

  async _validateTarget() {
    const rows = await PnpDisplayDevices.list();
    if (rows == null) return 'Could not enumerate display devices to validate the target.';
    const wanted = this._instanceId.toLowerCase();
    const match = rows.find((row) => String(row.InstanceId || '').trim().toLowerCase() === wanted);
    if (!match) return 'That instance ID is not a current display adapter.';
    if (PnpDisplayDevices.isNonGpu((match.FriendlyName || '').trim())) return 'Refusing to restart a software/basic display adapter.';
    return null;
  }

  _runElevated() {
    const elevated = DisplayRecoveryScripts.elevated(this._instanceId, this._resultPath);
    return PowerShellRunner.run(DisplayRecoveryScripts.launcher(elevated), DisplayDeviceRecovery.TIMEOUT_MS);
  }

  async _readVerdict() {
    try {
      return JSON.parse(PowerShellJson.stripBom(await fs.promises.readFile(this._resultPath, 'utf8')));
    } catch (_) {
      return null;
    }
  }

  static _launchError(result) {
    const reason = PowerShellRunner.failureMessage(result, 'Elevation failed');
    if (/canceled by the user|operation was canceled/i.test(reason)) {
      return 'Administrator approval was cancelled, so the device was not restarted.';
    }
    return reason;
  }

  static _exitCode(stdout) {
    const match = /EXITCODE=(-?\d+)/.exec(stdout || '');
    return match ? parseInt(match[1], 10) : null;
  }
}

module.exports = DisplayDeviceRecovery;
