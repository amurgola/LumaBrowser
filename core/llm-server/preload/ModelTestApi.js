const PreloadSection = require('./PreloadSection');

class ModelTestApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      ...ModelTestApi._fitTest(ipcRenderer),
      ...ModelTestApi._gambit(ipcRenderer),
    };
  }

  static _fitTest(ipcRenderer) {
    return {
      runFitTest: (modelPath) => ipcRenderer.invoke('core.llmServer.runFitTest', { modelPath }),
      cancelFitTest: () => ipcRenderer.invoke('core.llmServer.cancelFitTest'),
      getFitResults: () => ipcRenderer.invoke('core.llmServer.getFitResults'),
      getLocalModelOptions: () => ipcRenderer.invoke('core.llmServer.getLocalModelOptions'),
      getFitTestStatus: () => ipcRenderer.invoke('core.llmServer.getFitTestStatus'),
      onFitTestEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.fitTestEvent'),
    };
  }

  static _gambit(ipcRenderer) {
    return {
      runGambit: (modelPath, filter, opts) => ipcRenderer.invoke('core.llmServer.runGambit', { modelPath, filter, ...(opts || {}) }),
      cancelGambit: () => ipcRenderer.invoke('core.llmServer.cancelGambit'),
      getGambitStatus: () => ipcRenderer.invoke('core.llmServer.getGambitStatus'),
      getGambitResults: () => ipcRenderer.invoke('core.llmServer.getGambitResults'),
      getGambitRaw: () => ipcRenderer.invoke('core.llmServer.getGambitRaw'),
      onGambitEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.gambitEvent'),
    };
  }
}

module.exports = ModelTestApi;
