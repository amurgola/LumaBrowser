const { contextBridge, ipcRenderer } = require('electron');

const CHANNEL = 'ext.tab-share.rtc';

contextBridge.exposeInMainWorld('tabShareRtc', {
  send: (msg) => ipcRenderer.send(CHANNEL, msg),
  on: (fn) => { ipcRenderer.on(CHANNEL, (_e, msg) => fn(msg)); },
});
