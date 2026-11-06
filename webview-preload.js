const { ipcRenderer, webFrame, contextBridge } = require('electron');
const TabPreload = require('./core/browser/tab-preload/TabPreload');

new TabPreload({ ipcRenderer, webFrame, contextBridge }, window, {
  chrome: TabPreload.optionalSource(() => require('./core/browser/ChromeObjectShim')),
  passkey: TabPreload.optionalSource(() => require('./core/browser/PasskeyShim')),
}).install();
