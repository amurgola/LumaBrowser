import Dialogs from '../../dialogs/Dialogs.js';
import RuntimeInstallModal from '../../setup/RuntimeInstallModal.js';
import RuntimeRowProgress from './RuntimeRowProgress.js';
import PrereleaseInstall from './PrereleaseInstall.js';

export default class RuntimeActions {
  constructor(ctx) {
    this._ctx = ctx;
    this._progress = new RuntimeRowProgress(ctx.doc);
    this._prerelease = new PrereleaseInstall(ctx, this._progress, this);
  }

  async trigger(action, id, url) {
    if ((action === 'open-external' || action === 'open-releases') && url) { this._openExternal(url); return; }
    const api = this._ctx.api;
    if (!api) return;
    if (action === 'register-binary') await this._registerPicked(id);
    else if (action === 'clear-binary') await this._clearRegistration(id);
    else if (action === 'install') await this._install(id);
    else if (action === 'install-prerelease') await this._prerelease.run(id);
    else if (action === 'relocate') await this.locate(id);
    else if (action === 'uninstall') await this._uninstall(id);
  }

  async autoInstall(id, channel) {
    this._progress.setButtonsDisabled(id, true);
    this._progress.set(id, { phase: 'Starting…', indeterminate: true });
    const res = await this._ctx.api.installRuntime(id, channel === 'prerelease' ? { channel: 'prerelease' } : null);
    if (!res || !res.success) {
      this._progress.set(id, { phase: `Failed: ${(res && res.error) || 'unknown'}`, indeterminate: false, received: 0, total: 0 });
      this._progress.setButtonsDisabled(id, false);
      return;
    }
    await this._ctx.cards.runtimes.render();
  }

  async locate(id) {
    this._progress.setButtonsDisabled(id, true);
    const res = await this._ctx.api.locateRuntime(id);
    if (res && res.canceled) { this._progress.setButtonsDisabled(id, false); return; }
    if (!res || !res.success) {
      await Dialogs.alert((res && res.error) || 'Could not find the runtime executable in that folder.');
      this._progress.setButtonsDisabled(id, false);
      return;
    }
    await this._repaint();
  }

  async _install(id) {
    const r = this._ctx.runtimes.get(id) || {};
    if (r.acquisition === 'extension') { await this.autoInstall(id); return; }
    const choice = await RuntimeInstallModal.open({ name: r.name || id, assetSupported: r.assetSupported !== false, installed: !!r.installed });
    if (!choice) return;
    if (choice === 'locate') { await this.locate(id); return; }
    await this.clearManualShadow(r, id);
    await this.autoInstall(id);
  }

  async clearManualShadow(r, id) {
    if (r.source !== 'manual') return;
    try { await this._ctx.api.registerRuntimeBinary(id, null); } catch (_) {}
  }

  async _registerPicked(id) {
    const picked = await this._ctx.api.pickRuntimeBinary(id);
    if (!picked || picked.canceled || !picked.binaryPath) return;
    const res = await this._ctx.api.registerRuntimeBinary(id, picked.binaryPath);
    if (!res || !res.success) { await Dialogs.alert((res && res.error) || 'Failed to register binary.'); return; }
    await this._repaint();
  }

  async _clearRegistration(id) {
    const res = await this._ctx.api.registerRuntimeBinary(id, null);
    if (!res || !res.success) { await Dialogs.alert((res && res.error) || 'Failed to clear registration.'); return; }
    await this._repaint();
  }

  async _uninstall(id) {
    this._progress.setButtonsDisabled(id, true);
    this._progress.set(id, { phase: 'Removing…', indeterminate: true });
    const res = await this._ctx.api.uninstallRuntime(id);
    if (!res || !res.success) this._progress.set(id, { phase: `Failed: ${(res && res.error) || 'unknown'}`, indeterminate: false });
    await this._repaint();
  }

  async _repaint() {
    await this._ctx.cards.runtimes.render();
    await this._ctx.cards.defaults.render();
  }

  _openExternal(url) {
    const api = this._ctx.api;
    if (api && api.openExternal) api.openExternal(url).catch(() => this._ctx.win.open(url, '_blank'));
    else this._ctx.win.open(url, '_blank');
  }
}
