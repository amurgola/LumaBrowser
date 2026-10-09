const PreloadSection = require('./PreloadSection');

class GroundingApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      grounding: {
        getView: () => ipcRenderer.invoke('core.groundingServer.getView'),
        setModel: (sel) => ipcRenderer.invoke('core.groundingServer.setModel', sel || {}),
        pickModel: () => ipcRenderer.invoke('core.groundingServer.pickModel'),
        downloadRecommended: (id) => ipcRenderer.invoke('core.groundingServer.downloadRecommended', id),
        cancelDownload: () => ipcRenderer.invoke('core.groundingServer.cancelDownload'),
        setAutoUnload: (ms) => ipcRenderer.invoke('core.groundingServer.setAutoUnload', ms),
        start: () => ipcRenderer.invoke('core.groundingServer.start'),
        stop: () => ipcRenderer.invoke('core.groundingServer.stop'),
        onEvent: PreloadSection.subscribe(ipcRenderer, 'core.groundingServer.event'),
        desktopState: () => ipcRenderer.invoke('core.desktop.getState'),
        setDesktopEnabled: (on) => ipcRenderer.invoke('core.desktop.setEnabled', !!on),
      },
    };
  }
}

module.exports = GroundingApi;
