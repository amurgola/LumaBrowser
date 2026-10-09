const PreloadSection = require('./PreloadSection');

class PlacementApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      placement: {
        isAvailable: () => ipcRenderer.invoke('core.placement.isAvailable'),
        getConfig: () => ipcRenderer.invoke('core.placement.getConfig'),
        setConfig: (patch) => ipcRenderer.invoke('core.placement.setConfig', patch),
        autoArrange: () => ipcRenderer.invoke('core.placement.autoArrange'),
        getMeasured: () => ipcRenderer.invoke('core.placement.getMeasured'),
        getVramSnapshot: () => ipcRenderer.invoke('core.placement.getVramSnapshot'),
        getHotswapInfo: () => ipcRenderer.invoke('core.placement.getHotswapInfo'),
        start: () => ipcRenderer.invoke('core.placement.start'),
        stop: () => ipcRenderer.invoke('core.placement.stop'),
        runTest: () => ipcRenderer.invoke('core.placement.runTest'),
        onTestEvent: PreloadSection.subscribe(ipcRenderer, 'core.placement.testEvent'),
      },
    };
  }
}

module.exports = PlacementApi;
