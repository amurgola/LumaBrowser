const PreloadSection = require('./PreloadSection');

class ModelSetupApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      ...ModelSetupApi._catalog(ipcRenderer),
      ...ModelSetupApi._downloads(ipcRenderer),
      ...ModelSetupApi._addons(ipcRenderer),
    };
  }

  static _catalog(ipcRenderer) {
    return {
      modelCatalog: () => ipcRenderer.invoke('core.llmServer.modelCatalog'),
      modelCatalogLive: (opts) => ipcRenderer.invoke('core.llmServer.modelCatalogLive', opts || {}),
      searchModels: (args) => ipcRenderer.invoke('core.llmServer.searchModels', args || {}),
      expandModelRepo: (repoId, opts) => ipcRenderer.invoke('core.llmServer.expandModelRepo', repoId, opts || {}),
      getModelReadme: (repoId) => ipcRenderer.invoke('core.llmServer.getModelReadme', repoId),
      getWizardHardware: () => ipcRenderer.invoke('core.llmServer.getWizardHardware'),
      recommendModel: (answers) => ipcRenderer.invoke('core.llmServer.recommendModel', answers),
      planAutoSetup: (opts) => ipcRenderer.invoke('core.llmServer.planAutoSetup', opts || {}),
      setEnabled: (v) => ipcRenderer.invoke('core.llmServer.setEnabled', v),
      setOpenTabOnLoad: (v) => ipcRenderer.invoke('core.llmServer.setOpenTabOnLoad', v),
    };
  }

  static _downloads(ipcRenderer) {
    return {
      downloadModel: (args) => ipcRenderer.invoke('core.llmServer.downloadModel', args),
      cancelModelDownload: () => ipcRenderer.invoke('core.llmServer.cancelModelDownload'),
      pauseModelDownload: () => ipcRenderer.invoke('core.llmServer.pauseModelDownload'),
      onModelEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.modelEvent'),
    };
  }

  static _addons(ipcRenderer) {
    return {
      addonModelCatalog: () => ipcRenderer.invoke('core.llmServer.addonModelCatalog'),
      setupAddonModel: (id) => ipcRenderer.invoke('core.llmServer.setupAddonModel', id),
      cancelAddonSetup: () => ipcRenderer.invoke('core.llmServer.cancelAddonSetup'),
      onAddonEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.addonEvent'),
    };
  }
}

module.exports = ModelSetupApi;
