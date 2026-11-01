const { contextBridge, ipcRenderer } = require('electron');

const PREFIX = 'ext.desktop-integration.window-tabs.';

contextBridge.exposeInMainWorld('windowTab', {
  call: (name, data) => ipcRenderer.invoke(`${PREFIX}page.${name}`, data),
});
