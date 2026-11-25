import WizardApis from './WizardApis.js';

export default class WizardAddons {
  static LIST_CHANNEL = 'core.shell.getAvailableAddons';
  static INSTALL_CHANNEL = 'core.shell.downloadAndInstallAddon';
  static NEEDS_ANOTHER_FIRST = /^Requires extension /;

  constructor({ invoke = WizardApis.invoke } = {}) {
    this._invoke = invoke;
    this._entries = [];
    this._catalogLoaded = false;
  }

  async load() {
    try {
      const res = await this._invoke(WizardAddons.LIST_CHANNEL);
      if (!(res && res.ok)) return;
      this._entries = (res.extensions || []).filter((a) => a && a.id && !a.installed && !a.private);
      this._catalogLoaded = true;
    } catch (_) {}
  }

  entries() {
    return this._entries.slice();
  }

  find(id) {
    return this._entries.find((a) => a.id === id) || null;
  }

  pending(enabledIds, installedIds) {
    const installed = new Set(installedIds);
    const missing = enabledIds.filter((id) => !installed.has(id));
    return this._catalogLoaded ? missing.filter((id) => this.find(id)) : missing;
  }

  async install(ids, onProgress = () => {}) {
    const installed = [];
    const failed = [];
    let queue = ids.slice();
    let attempt = 0;
    while (queue.length) {
      const deferred = [];
      for (const id of queue) {
        attempt += 1;
        onProgress({ id, name: this.nameOf(id), index: Math.min(attempt, ids.length), total: ids.length });
        const error = await this._installOne(id);
        if (!error) installed.push(id);
        else if (WizardAddons.NEEDS_ANOTHER_FIRST.test(error)) deferred.push({ id, error });
        else failed.push({ id, name: this.nameOf(id), error });
      }
      const progressed = deferred.length < queue.length;
      queue = progressed ? deferred.map((d) => d.id) : [];
      if (!progressed) for (const d of deferred) failed.push({ id: d.id, name: this.nameOf(d.id), error: d.error });
    }
    return { installed, failed };
  }

  nameOf(id) {
    const entry = this.find(id);
    return (entry && entry.name) || id;
  }

  async _installOne(id) {
    try {
      const res = await this._invoke(WizardAddons.INSTALL_CHANNEL, id);
      if (!(res && res.success)) return (res && res.error) || 'install failed';
      return res.activated === false ? (res.activationError || 'installed but not activated') : null;
    } catch (err) {
      return (err && err.message) || 'install failed';
    }
  }
}
