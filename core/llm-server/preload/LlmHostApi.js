const PreloadSection = require('./PreloadSection');

class LlmHostApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      ...LlmHostApi._diagnostics(ipcRenderer),
      ...LlmHostApi._models(ipcRenderer),
      ...LlmHostApi._preflight(ipcRenderer),
    };
  }

  static _diagnostics(ipcRenderer) {
    return {
      getDiagnostics: (options) => ipcRenderer.invoke('core.llmServer.getDiagnostics', options || {}),
      addNvidiaSmiToPath: (directory) => ipcRenderer.invoke('core.llmServer.addNvidiaSmiToPath', directory),
      dismissNvidiaSmiPathHint: () => ipcRenderer.invoke('core.llmServer.dismissNvidiaSmiPathHint'),
      recoverDisplayDevice: (instanceId) => ipcRenderer.invoke('core.llmServer.recoverDisplayDevice', instanceId),
      setPcieAspmOff: () => ipcRenderer.invoke('core.llmServer.setPcieAspmOff'),
    };
  }

  static _models(ipcRenderer) {
    return {
      getModelsView: () => ipcRenderer.invoke('core.llmServer.getModelsView'),
      setModelsDir: (directory) => ipcRenderer.invoke('core.llmServer.setModelsDir', directory),
      pickModelsDir: () => ipcRenderer.invoke('core.llmServer.pickModelsDir'),
      getStorageInfo: () => ipcRenderer.invoke('core.llmServer.getStorageInfo'),
      scanExistingLibraries: () => ipcRenderer.invoke('core.llmServer.scanExistingLibraries'),
      importExistingModel: (args) => ipcRenderer.invoke('core.llmServer.importExistingModel', args),
      pickDirectory: (opts) => ipcRenderer.invoke('core.llmServer.pickDirectory', opts),
      getModelDisplayNames: () => ipcRenderer.invoke('core.llmServer.getModelDisplayNames'),
      setModelDisplayName: (key, name) => ipcRenderer.invoke('core.llmServer.setModelDisplayName', key, name),
    };
  }

  static _preflight(ipcRenderer) {
    return {
      getPreflight: () => ipcRenderer.invoke('core.llmServer.getPreflight'),
      getVramPressure: () => ipcRenderer.invoke('core.llmServer.getVramPressure'),
      dismissVramPressure: (card) => ipcRenderer.invoke('core.llmServer.dismissVramPressure', card),
      getUnloadOnVramPressure: () => ipcRenderer.invoke('core.llmServer.getUnloadOnVramPressure'),
      setUnloadOnVramPressure: (v) => ipcRenderer.invoke('core.llmServer.setUnloadOnVramPressure', v),
      checkSystemLibraries: () => ipcRenderer.invoke('core.llmServer.checkSystemLibraries'),
    };
  }
}

module.exports = LlmHostApi;
