export default class ExtensionMetaStore {
  static LIST_CHANNEL = 'core.shell.getExtensions';

  constructor() {
    this._byId = new Map();
  }

  setAll(list) {
    for (const ext of list || []) this._byId.set(ext.id, ext);
  }

  async refresh() {
    this.setAll(await window.ipcBridge.invoke(ExtensionMetaStore.LIST_CHANNEL));
  }

  get(id) {
    return this._byId.get(id) || null;
  }

  delete(id) {
    this._byId.delete(id);
  }

  values() {
    return [...this._byId.values()];
  }

  enabledInLoadOrder() {
    return this.values()
      .filter((e) => e && e.enabled !== false)
      .sort((a, b) => (a.loadOrder || 0) - (b.loadOrder || 0));
  }

  displayName(id) {
    const meta = this.get(id);
    return (meta && meta.name) || id;
  }
}
