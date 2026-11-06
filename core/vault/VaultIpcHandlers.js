const { ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('fs');

class VaultIpcHandlers {
  static EXPORT_NAME = 'LumaBrowser Passwords.csv';

  constructor({ vault, getTabViewManager, ipc = ipcMain, dialogApi = dialog, fsApi = fs }) {
    this._vault = vault;
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
    this._dialog = dialogApi;
    this._fs = fsApi;
  }

  register() {
    const v = this._vault;
    this._chrome('core.vault.status', () => v.status());
    this._chrome('core.vault.list', () => v.list());
    this._chrome('core.vault.reveal', (_e, id) => v.reveal(id));
    this._chrome('core.vault.save', (_e, fields) => v.save(fields));
    this._chrome('core.vault.remove', (_e, id) => v.remove(id));
    this._chrome('core.vault.generate', () => v.generate());
    this._chrome('core.vault.setOfferToSave', (_e, on) => v.setOfferToSave(on));
    this._chrome('core.vault.neverList', () => v.neverList());
    this._chrome('core.vault.neverRemove', (_e, origin) => v.removeNever(String(origin || '')));
    this._chrome('core.vault.answerPrompt', (_e, promptId, decision) => v.answerPrompt(promptId, decision));
    this._chrome('core.vault.fill', (_e, tabId, itemId) => v.fill(tabId, itemId));
    this._chrome('core.vault.fillGenerated', (_e, tabId) => v.fillGenerated(tabId));
    this._chrome('core.vault.fillProfile', (_e, tabId, itemId) => v.fillProfile(tabId, itemId));
    this._chrome('core.vault.setOfferAddresses', (_e, on) => v.setOfferAddresses(on));
    this._chrome('core.vault.unlock', (_e, password) => v.unlock(password));
    this._chrome('core.vault.lock', () => v.lockNow());
    this._chrome('core.vault.setMasterPassword', (_e, current, next) => v.setMasterPassword(current, next));
    this._chrome('core.vault.removeMasterPassword', (_e, current) => v.removeMasterPassword(current));
    this._chrome('core.vault.setAutoLock', (_e, minutes) => v.setAutoLockMinutes(minutes));
    this._chrome('core.vault.setAllowExternal', (_e, on) => v.agent.setAllowExternal(on));
    this._chrome('core.vault.auditList', () => v.audit.list());
    this._chrome('core.vault.totpCode', (_e, id) => v.totpCode(id));
    this._chrome('core.vault.fillOtp', (_e, tabId, itemId) => v.fillOtp(tabId, itemId));
    this._chrome('core.vault.menuState', (_e, tabId, state) => v.menuState(tabId, state));
    this._chrome('core.vault.auditClear', () => v.audit.clear());
    this._chrome('core.vault.loginsForTab', (_e, tabId) => v.loginsForTab(tabId));
    this._chrome('core.vault.importFile', (e) => this._importFile(e));
    this._chrome('core.vault.exportFile', (e) => this._exportFile(e));
  }

  isChrome(sender) {
    const tvm = this._tvm();
    return !!(tvm && typeof tvm.isChromeSender === 'function' && tvm.isChromeSender(sender));
  }

  _chrome(channel, fn) {
    this._ipc.handle(channel, async (event, ...args) => {
      if (!this.isChrome(event && event.sender)) return { success: false, error: 'Not allowed' };
      try {
        return await fn(event, ...args);
      } catch (err) {
        return { success: false, error: err.message };
      }
    });
  }

  async _importFile(event) {
    const res = await this._dialog.showOpenDialog(this._window(event), {
      title: 'Import passwords', properties: ['openFile'], filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return { success: false, canceled: true };
    return this._vault.importCsv(this._fs.readFileSync(res.filePaths[0], 'utf8'));
  }

  async _exportFile(event) {
    const locked = this._vault.lockedError();
    if (locked) return locked;
    const res = await this._dialog.showSaveDialog(this._window(event), {
      title: 'Export passwords', defaultPath: VaultIpcHandlers.EXPORT_NAME, filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (res.canceled || !res.filePath) return { success: false, canceled: true };
    this._fs.writeFileSync(res.filePath, this._vault.exportCsv(), 'utf8');
    return { success: true, path: res.filePath };
  }

  _window(event) {
    try { return BrowserWindow.fromWebContents(event.sender) || undefined; } catch (_) { return undefined; }
  }
}

module.exports = VaultIpcHandlers;
