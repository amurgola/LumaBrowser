const PreloadSection = require('./PreloadSection');

class ModelTestApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      runFitTest: (modelPath) => ipcRenderer.invoke('core.llmServer.runFitTest', { modelPath }),
      cancelFitTest: () => ipcRenderer.invoke('core.llmServer.cancelFitTest'),
      getFitResults: () => ipcRenderer.invoke('core.llmServer.getFitResults'),
      getLocalModelOptions: () => ipcRenderer.invoke('core.llmServer.getLocalModelOptions'),
      getFitTestStatus: () => ipcRenderer.invoke('core.llmServer.getFitTestStatus'),
      onFitTestEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.fitTestEvent'),
    };
  }
}

module.exports = ModelTestApi;
