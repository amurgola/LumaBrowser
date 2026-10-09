class OverlayPreloadApi {
  static GLOBAL_NAME = 'overlayAPI';

  static expose(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld(OverlayPreloadApi.GLOBAL_NAME, OverlayPreloadApi.build(ipcRenderer));
  }

  static build(ipcRenderer) {
    return {
      onContent: (cb) => { ipcRenderer.on('overlay:content', (_e, p) => cb(p)); },
      onSetActive: (cb) => { ipcRenderer.on('overlay:set-active', (_e, p) => cb(p)); },
      measure: (height) => ipcRenderer.send('chrome-overlay:measure', { height }),
      sendAction: (payload) => ipcRenderer.send('chrome-overlay:action', payload),
      sendHover: (payload) => ipcRenderer.send('chrome-overlay:hover', payload),
      dismiss: () => ipcRenderer.send('chrome-overlay:dismiss'),
    };
  }
}

module.exports = OverlayPreloadApi;
