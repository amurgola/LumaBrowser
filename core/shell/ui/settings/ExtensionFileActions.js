import Dialogs from '../../../llm-server/ui/js/dialogs/Dialogs.js';

export default class ExtensionFileActions {
  constructor({ meta, host, hooks, onDeleted }) {
    this._meta = meta;
    this._host = host;
    this._hooks = hooks;
    this._onDeleted = onDeleted;
  }

  async createNew() {
    const name = await ExtensionFileActions._askName();
    if (!name) return;
    try {
      const result = await this._invoke('core.shell.createExtensionTemplate', name.trim());
      if (!result.success) { this._hooks.toast(`Could not create the extension: ${result.error}`, 'bad'); return; }
      const opened = await this._invoke('core.shell.openExtensionEditor', result.dir, result.extensionId);
      if (opened && opened.success === false) { this._hooks.toast(`Could not open the editor: ${opened.error}`, 'bad'); return; }
      this._hooks.toast(`"${name}" created. Restart the app after editing to activate it.`, 'ok');
    } catch (e) {
      this._hooks.toast(`Could not create the extension: ${e.message}`, 'bad');
    }
  }

  async installZip() {
    if (!window.ipcBridge) return;
    try {
      const dialogResult = await this._invoke('core.shell.openExtensionFileDialog');
      if (dialogResult.canceled) return;
      const result = await this._invoke('core.shell.installExtension', dialogResult.filePath);
      if (!result.success) { this._hooks.toast(`Could not install the extension: ${result.error}`, 'bad'); return; }
      this._hooks.toast(result.activated
        ? `"${result.name}" installed and running.`
        : `"${result.name}" installed, but it could not be started right now. Restart the app to activate it.`, result.activated ? 'ok' : 'bad');
    } catch (e) {
      this._hooks.toast(`Could not install the extension: ${e.message}`, 'bad');
    }
  }

  async export(extensionId) {
    const meta = this._meta.get(extensionId);
    const dir = ExtensionFileActions._dirOf(meta);
    if (!dir) { this._hooks.toast('Cannot find the extension directory', 'bad'); return; }
    try {
      const result = await this._invoke('core.shell.exportExtension', extensionId, dir);
      if (result.success) this._hooks.toast(`"${meta.name}" exported to ${result.filePath}`, 'ok');
      else if (!result.canceled) this._hooks.toast(`Could not export the extension: ${result.error}`, 'bad');
    } catch (e) {
      this._hooks.toast(`Could not export the extension: ${e.message}`, 'bad');
    }
  }

  async edit(extensionId) {
    const dir = ExtensionFileActions._dirOf(this._meta.get(extensionId));
    if (!dir) { this._hooks.toast('Cannot find the extension directory', 'bad'); return; }
    try {
      const opened = await this._invoke('core.shell.openExtensionEditor', dir, extensionId);
      if (opened && opened.success === false) this._hooks.toast(`Could not open the editor: ${opened.error}`, 'bad');
    } catch (e) {
      this._hooks.toast(`Could not open the editor: ${e.message}`, 'bad');
    }
  }

  async delete(id, name) {
    const label = name || id;
    const ok = await Dialogs.confirm(
      `Permanently delete "${label}"?\n\nThis removes the extension and its files from disk. This cannot be undone.`,
      { title: 'Delete extension', okLabel: 'Delete', danger: true },
    );
    if (!ok) return;
    try {
      const result = await this._invoke('core.shell.deleteExtension', id);
      if (!(result && result.success)) { this._hooks.toast((result && result.error) || `Could not delete "${label}"`, 'bad'); return; }
      this._afterDelete(id);
      this._hooks.toast(`"${label}" deleted`, 'ok');
    } catch (e) {
      this._hooks.toast(`Could not delete "${label}": ${e.message}`, 'bad');
    }
  }

  _afterDelete(id) {
    this._host.disable(id);
    this._meta.delete(id);
    document.dispatchEvent(new CustomEvent('extension-toggled', { detail: { id, enabled: false } }));
    this._onDeleted();
  }

  _invoke(channel, ...args) {
    return window.ipcBridge.invoke(channel, ...args);
  }

  static async _askName() {
    const v = await Dialogs.prompt('Enter a name for the new extension:', '', { title: 'New Extension', okLabel: 'Create' });
    const s = v == null ? '' : String(v).trim();
    return s || null;
  }

  static _dirOf(meta) {
    return meta && (meta.dir || meta._dir);
  }
}
