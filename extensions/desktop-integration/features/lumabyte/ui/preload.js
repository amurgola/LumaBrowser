const { contextBridge, ipcRenderer } = require('electron');

const PREFIX = 'ext.desktop-integration.lumabyte.';

contextBridge.exposeInMainWorld('lumabyte', {
  call: (name, data) => ipcRenderer.invoke(`${PREFIX}panel.${name}`, data),
  dock: (action) => ipcRenderer.invoke(`${PREFIX}dock.${action}`),
  onEvent: (cb) => ipcRenderer.on(`${PREFIX}event`, (_e, data) => cb(data)),
  onDock: (cb) => ipcRenderer.on(`${PREFIX}dockState`, (_e, data) => cb(data)),
});
