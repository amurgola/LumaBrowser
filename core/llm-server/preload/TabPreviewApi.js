const PreloadSection = require('./PreloadSection');

class TabPreviewApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      tabPreview: {
        rect: (rect) => ipcRenderer.send('tab-preview:rect', rect),
        focus: () => ipcRenderer.send('tab-preview:focus'),
        detach: () => ipcRenderer.send('tab-preview:detach'),
        onFrame: PreloadSection.subscribe(ipcRenderer, 'tab-preview:frame'),
        getEnabled: () => ipcRenderer.invoke('tab-preview:get-enabled'),
        setEnabled: (enabled) => ipcRenderer.invoke('tab-preview:set-enabled', enabled),
      },
    };
  }
}

module.exports = TabPreviewApi;
