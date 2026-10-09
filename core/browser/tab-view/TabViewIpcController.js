const { ipcMain } = require('electron');

class TabViewIpcController {
  static register(manager, notificationRelay) {
    TabViewIpcController._registerTabs(manager);
    TabViewIpcController._registerDownloads(manager.downloads);
    ipcMain.on('tab-view:set-bounds', (_event, bounds) => manager.setBounds(bounds));
    ipcMain.on('notification-intercepted', (event, data) => notificationRelay.relay(event.sender, data));
  }

  static _registerTabs(m) {
    const handle = (channel, fn) => ipcMain.handle(channel, fn);
    handle('tab-view:create', (_e, url, options) => m.createTab(url, options || {}));
    handle('tab-view:close', (_e, tabId) => m.closeTab(tabId));
    handle('tab-view:switch', (_e, tabId) => m.switchToTab(tabId));
    handle('tab-view:navigate', (_e, tabId, url) => m.navigate(tabId, url));
    handle('tab-view:reload', (_e, tabId) => m.reload(tabId));
    handle('tab-view:go-back', (_e, tabId) => m.goBack(tabId));
    handle('tab-view:go-forward', (_e, tabId) => m.goForward(tabId));
    handle('tab-view:get-history', (_e, tabId) => m.getHistory(tabId));
    handle('tab-view:go-to-index', (_e, tabId, index) => m.goToIndex(tabId, index));
    handle('tab-view:set-zoom', (_e, tabId, zoomLevel) => m.setZoom(tabId, zoomLevel));
    handle('tab-view:get-zoom', (_e, tabId) => m.getZoom(tabId));
    handle('tab-view:get-all', () => m.getAllTabs());
    handle('tab-view:get-order', () => m.getAllTabs({ includeSilent: true, includeInternal: true }));
    handle('tab-view:clear-cache', () => m.clearCache());
    handle('tab-view:set-persist', (_e, tabId, persist) => m.setTabPersistence(tabId, persist));
    handle('tab-view:show', (_e, tabId) => m.showTab(tabId));
    handle('tab-view:get-persisted', () => m.getPersistedTabs());
    handle('tab-view:stop', (_e, tabId) => m.stop(tabId));
    handle('tab-view:hard-reload', (_e, tabId) => m.reload(tabId, { ignoreCache: true }));
    handle('tab-view:move', (_e, tabId, toIndex) => m.moveTab(tabId, toIndex));
    handle('tab-view:cycle', (_e, delta) => m.cycleTab(Number(delta) || 1));
    handle('tab-view:select-index', (_e, n) => m.selectTabByIndex(Number(n) || 0));
    handle('tab-view:reopen-closed', () => m.reopenClosedTab());
    handle('tab-view:find', (_e, tabId, text, opts) => m.findInPage(tabId, text, opts || {}));
    handle('tab-view:stop-find', (_e, tabId, action) => m.stopFindInPage(tabId, action));
    handle('tab-view:print', (_e, tabId) => m.print(tabId));
    handle('tab-view:toggle-devtools', (_e, tabId) => m.toggleDevTools(tabId));
  }

  static _registerDownloads(downloads) {
    ipcMain.handle('tab-view:download-list', () => downloads.list());
    ipcMain.handle('tab-view:download-open', (_e, id) => downloads.open(id));
    ipcMain.handle('tab-view:download-show', (_e, id) => downloads.showInFolder(id));
    ipcMain.handle('tab-view:download-cancel', (_e, id) => downloads.cancel(id));
    ipcMain.handle('tab-view:download-clear', () => downloads.clearFinished());
  }
}

module.exports = TabViewIpcController;
