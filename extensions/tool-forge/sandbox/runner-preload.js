const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__forge', {
  onExec: (cb) => {
    ipcRenderer.on('toolforge:exec', (_e, msg) => { cb(msg); });
  },
  result: (msg) => ipcRenderer.send('toolforge:result', msg),
  net: (msg) => ipcRenderer.invoke('toolforge:net', msg),
});
