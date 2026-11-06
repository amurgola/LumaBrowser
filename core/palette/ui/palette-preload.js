const { contextBridge, ipcRenderer } = require('electron');

const on = (channel) => (cb) => {
  const listener = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('paletteAPI', {
  search: (query) => ipcRenderer.invoke('core.palette.search', String(query || '')),
  open: (item) => ipcRenderer.invoke('core.palette.open', item),
  close: () => ipcRenderer.invoke('core.palette.close'),
  dig: (query) => ipcRenderer.invoke('core.palette.dig', String(query || '')),
  digAbort: () => ipcRenderer.invoke('core.palette.digAbort'),
  continueInChat: (query) => ipcRenderer.invoke('core.palette.continueInChat', String(query || '')),
  onShow: on('palette:show'),
  onHidden: on('palette:hidden'),
  onDigEvent: on('core.palette.digEvent'),
});
