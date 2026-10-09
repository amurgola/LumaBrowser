import BootLog from '../boot/BootLog.js';

export default class SetupWizardLauncher {
  constructor({ SetupWizard, extensionLoader, slotManager }) {
    this._SetupWizard = SetupWizard;
    this._extensionLoader = extensionLoader;
    this._slotManager = slotManager;
  }

  async maybeShow(opts = {}) {
    try {
      BootLog.log('maybeShowSetupWizard enter');
      if (!window.electronAPI || !window.electronAPI.getSetupComplete) {
        BootLog.log('maybeShowSetupWizard: electronAPI missing, bail');
        return;
      }
      if (!opts.force && await SetupWizardLauncher._alreadySetUp()) return;
      await this._start();
    } catch (err) {
      console.error('Setup wizard failed to start:', err);
    }
  }

  static async _alreadySetUp() {
    const flagStart = Date.now();
    const flag = await window.electronAPI.getSetupComplete();
    BootLog.log(`getSetupComplete returned in ${Date.now() - flagStart}ms (flag=${!!flag})`);
    return !!flag;
  }

  async _start() {
    if (!this._SetupWizard) {
      BootLog.log('maybeShowSetupWizard: SetupWizard class missing, bail');
      return;
    }
    const modalEl = document.getElementById('setupWizardModal');
    if (!modalEl) return;
    const wizard = new this._SetupWizard({ modalEl, onComplete: () => this._onComplete() });
    BootLog.log('SetupWizard constructed, calling start()');
    await wizard.start();
    BootLog.log('wizard.start() returned');
  }

  async _onComplete() {
    await this._extensionLoader.load();
    const slots = this._slotManager;
    if (!slots || typeof slots.refreshTelemetryPanel !== 'function') return;
    try { await slots.refreshTelemetryPanel(); } catch (_) {}
  }
}
