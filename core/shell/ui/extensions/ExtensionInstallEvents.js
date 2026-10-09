export default class ExtensionInstallEvents {
  static INSTALLED = 'core.shell.extensionInstalled';

  static DELETED = 'core.shell.extensionDeleted';

  constructor({ host, meta, onListChanged }) {
    this._host = host;
    this._meta = meta;
    this._onListChanged = onListChanged;
    this._subscribed = false;
  }

  subscribe() {
    if (this._subscribed || !window.ipcBridge || typeof window.ipcBridge.on !== 'function') return;
    this._subscribed = true;
    window.ipcBridge.on(ExtensionInstallEvents.INSTALLED, (payload) => this._installed(payload));
    window.ipcBridge.on(ExtensionInstallEvents.DELETED, (payload) => this._deleted(payload));
  }

  async _installed(payload) {
    const id = payload && payload.id;
    if (!id) return;
    try {
      await this._meta.refresh();
      if (this._host.isLoaded(id)) {
        this._host.disable(id);
        this._host.purge(id);
      }
      await this._host.enable(id);
      this._onListChanged();
    } catch (e) {
      console.warn('UISlotManager: failed to wire hot-installed extension:', e && e.message);
    }
  }

  _deleted(payload) {
    const id = payload && payload.id;
    if (!id) return;
    try {
      this._host.disable(id);
      this._meta.delete(id);
      this._onListChanged();
    } catch (e) {
      console.warn('UISlotManager: failed to handle deleted extension:', e && e.message);
    }
  }
}
