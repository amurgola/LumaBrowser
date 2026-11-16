class DownloadsPageBridge {
  static install(contextBridge, ipcRenderer, win) {
    if (!contextBridge || !win || !win.location) return false;
    if (win.location.protocol !== 'luma:' || win.location.hostname !== 'downloads') return false;
    contextBridge.exposeInMainWorld('lumaDownloads', {
      list: () => ipcRenderer.invoke('core.downloads.list'),
      open: (id) => ipcRenderer.invoke('core.downloads.open', id),
      show: (id) => ipcRenderer.invoke('core.downloads.show', id),
      copyLink: (id) => ipcRenderer.invoke('core.downloads.copyLink', id),
      cancel: (id) => ipcRenderer.invoke('core.downloads.cancel', id),
      remove: (id) => ipcRenderer.invoke('core.downloads.remove', id),
      clear: () => ipcRenderer.invoke('core.downloads.clear'),
      onEvent: (listener) => { ipcRenderer.on('core.downloads.event', (_event, payload) => listener(payload)); },
    });
    return true;
  }
}

module.exports = DownloadsPageBridge;
