class NewTabBridge {
  static install(contextBridge, ipcRenderer, win) {
    if (!contextBridge || !win || !win.location) return false;
    if (win.location.protocol !== 'luma:' || win.location.hostname !== 'newtab') return false;
    contextBridge.exposeInMainWorld('lumaNewTab', {
      data: () => ipcRenderer.invoke('core.newtab.data'),
      search: (query) => ipcRenderer.invoke('core.newtab.search', String(query || '')),
      hide: (url) => ipcRenderer.invoke('core.newtab.hide', String(url || '')),
    });
    return true;
  }
}

module.exports = NewTabBridge;
