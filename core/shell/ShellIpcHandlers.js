const { ipcMain, shell, dialog } = require('electron');
const AddonClient = require('./AddonClient');
const AddonCatalog = require('./extension-admin/AddonCatalog');
const AppLicenseInfo = require('./extension-admin/AppLicenseInfo');
const ExtensionEditorHints = require('./extension-admin/ExtensionEditorHints');
const ExtensionEditorWindows = require('./extension-admin/ExtensionEditorWindows');
const ExtensionExporter = require('./extension-admin/ExtensionExporter');
const ExtensionFolderResolver = require('./extension-admin/ExtensionFolderResolver');
const ExtensionSourceFiles = require('./extension-admin/ExtensionSourceFiles');
const ExtensionTemplate = require('./extension-admin/ExtensionTemplate');
const ExtensionZipInstaller = require('./extension-admin/ExtensionZipInstaller');
const ExternalUrl = require('./extension-admin/ExternalUrl');

class ShellIpcHandlers {
  static SETTINGS_TAB = /^[a-z0-9-]{1,40}$/i;

  constructor({ extensionManager, mainWindowGetter, rootDir, identity = null, waitForExtensions = null }) {
    this._extensions = extensionManager;
    this._mainWindow = mainWindowGetter || (() => null);
    this._rootDir = rootDir;
    this._identity = identity;
    this._waitForExtensions = waitForExtensions;
    this._installer = new ExtensionZipInstaller({ extensionManager, rootDir });
    this._template = new ExtensionTemplate({ rootDir });
    this._hints = new ExtensionEditorHints(extensionManager);
    this._editors = new ExtensionEditorWindows({ resolver: new ExtensionFolderResolver(extensionManager) });
  }

  register() {
    this._registerExtensions();
    this._registerAddons();
    this._registerEditor();
    this._registerShell();
  }

  _registerExtensions() {
    const em = this._extensions;
    ipcMain.handle('core.shell.getExtensions', () => this._rendererExtensionList());
    ipcMain.handle('core.shell.getExtensionErrors', () => em.getErrors());
    ipcMain.handle('core.shell.toggleExtension', (_e, id, enabled) => (enabled ? em.enableExtension(id) : em.disableExtension(id)));
    ipcMain.handle('core.shell.getToggleConstraints', () => em.getToggleConstraints());
    ipcMain.handle('core.shell.deleteExtension', (_e, id) => em.deleteExtension(id));
    ipcMain.handle('core.shell.getExtensionRendererSource', (_e, id) => em.getRendererSource(id));
    ipcMain.handle('core.shell.installExtension', (_e, filePath) => this._installer.install(filePath));
    ipcMain.handle('core.shell.openExtensionFileDialog', () => this._chooseExtensionZip());
    ipcMain.handle('core.shell.exportExtension', (_e, id, extDir) => new ExtensionExporter().export(id, extDir, (m) => this._chooseExportPath(id, m)));
  }

  _registerAddons() {
    ipcMain.handle('core.shell.getAvailableAddons', () => this._addons().list());
    ipcMain.handle('core.shell.downloadAndInstallAddon', (_e, addonId) => this._addons().downloadAndInstall(addonId));
  }

  _registerEditor() {
    const scope = (e) => this._editors.sessionOf(e);
    ipcMain.handle('core.shell.listExtensionFiles', (e) => ExtensionSourceFiles.list(scope(e).dir));
    ipcMain.handle('core.shell.readExtensionFile', (e, fileName) => ExtensionSourceFiles.read(scope(e).dir, fileName));
    ipcMain.handle('core.shell.writeExtensionFile', (e, fileName, content) => ExtensionSourceFiles.write(scope(e).dir, fileName, content));
    ipcMain.handle('core.shell.getExtensionAutocompleteData', (e) => this._hints.build(scope(e).extensionId));
    ipcMain.handle('core.shell.openExtensionEditor', (_e, _ignoredDir, extId) => this._editors.open(extId));
    ipcMain.handle('core.shell.createExtensionTemplate', (_e, extName) => this._template.create(extName));
  }

  _registerShell() {
    ipcMain.handle('core.shell.openExternal', (_e, url) => this._openExternal(url));
    ipcMain.handle('core.shell.openSettings', (_e, tab) => this._openSettings(tab));
    ipcMain.handle('core.shell.getLicenses', () => AppLicenseInfo.read(this._rootDir));
  }

  async _rendererExtensionList() {
    if (this._waitForExtensions) await this._waitForExtensions();
    return this._extensions.getRendererExtensionList();
  }

  _addons() {
    if (!this._catalog) {
      const client = new AddonClient({ identity: this._identity });
      this._catalog = new AddonCatalog({ client, installer: this._installer, extensionManager: this._extensions });
    }
    return this._catalog;
  }

  async _openExternal(url) {
    const refusal = ExternalUrl.refusal(url);
    if (refusal) return { success: false, error: refusal };
    await shell.openExternal(url);
    return { success: true };
  }

  _openSettings(tab) {
    const win = this._mainWindow();
    if (!win || win.isDestroyed()) return { success: false, error: 'no main window' };
    const settingsTab = typeof tab === 'string' && ShellIpcHandlers.SETTINGS_TAB.test(tab) ? tab : 'general';
    win.webContents.send('tab-view:accelerator', { action: 'open-settings', settingsTab });
    return { success: true };
  }

  async _chooseExtensionZip() {
    const result = await dialog.showOpenDialog(this._mainWindow(), {
      title: 'Install Extension',
      filters: [{ name: 'Extension Archives', extensions: ['zip'] }, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    return { canceled: false, filePath: result.filePaths[0] };
  }

  async _chooseExportPath(extensionId, manifest) {
    const result = await dialog.showSaveDialog(this._mainWindow(), {
      title: `Export Extension: ${manifest.name || extensionId}`,
      defaultPath: `${extensionId}.zip`,
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    });
    return result.canceled || !result.filePath ? null : result.filePath;
  }
}

module.exports = ShellIpcHandlers;
