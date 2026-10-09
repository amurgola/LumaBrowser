const PreloadSection = require('./PreloadSection');

class ImageApi extends PreloadSection {
  static build(ipcRenderer) {
    const sub = (channel) => PreloadSection.subscribe(ipcRenderer, channel);
    return {
      image: {
        getEnabled: () => ipcRenderer.invoke('core.imageServer.getEnabled'),
        setEnabled: (enabled) => ipcRenderer.invoke('core.imageServer.setEnabled', enabled),
        ...ImageApi._runtimes(ipcRenderer, sub),
        ...ImageApi._models(ipcRenderer, sub),
        ...ImageApi._imports(ipcRenderer),
        ...ImageApi._server(ipcRenderer, sub),
        video: ImageApi._video(ipcRenderer, sub),
      },
    };
  }

  static _runtimes(ipcRenderer, sub) {
    return {
      getRuntimesView: (opts) => ipcRenderer.invoke('core.imageServer.getRuntimesView', opts || null),
      checkRuntimeUpdates: () => ipcRenderer.invoke('core.imageServer.checkRuntimeUpdates'),
      installRuntime: (id) => ipcRenderer.invoke('core.imageServer.installRuntime', id),
      uninstallRuntime: (id) => ipcRenderer.invoke('core.imageServer.uninstallRuntime', id),
      locateRuntime: (id) => ipcRenderer.invoke('core.imageServer.locateRuntime', id),
      registerRuntimeBinary: (id, binaryPath) => ipcRenderer.invoke('core.imageServer.registerRuntimeBinary', id, binaryPath),
      onRuntimeEvent: sub('core.imageServer.runtimeEvent'),
    };
  }

  static _models(ipcRenderer, sub) {
    return {
      getModelsView: () => ipcRenderer.invoke('core.imageServer.getModelsView'),
      setModelsDir: (dir) => ipcRenderer.invoke('core.imageServer.setModelsDir', dir),
      pickModelsDir: () => ipcRenderer.invoke('core.imageServer.pickModelsDir'),
      getModelDisplayNames: () => ipcRenderer.invoke('core.imageServer.getModelDisplayNames'),
      setModelDisplayName: (key, name) => ipcRenderer.invoke('core.imageServer.setModelDisplayName', key, name),
      setModelKind: (modelId, kind) => ipcRenderer.invoke('core.imageServer.setModelKind', modelId, kind),
      modelCatalog: () => ipcRenderer.invoke('core.imageServer.modelCatalog'),
      downloadModel: (args) => ipcRenderer.invoke('core.imageServer.downloadModel', args),
      cancelModelDownload: () => ipcRenderer.invoke('core.imageServer.cancelModelDownload'),
      removeInstalledModel: (id) => ipcRenderer.invoke('core.imageServer.removeInstalledModel', id),
      updateModelFile: (args) => ipcRenderer.invoke('core.imageServer.updateModelFile', args),
      onModelEvent: sub('core.imageServer.modelEvent'),
    };
  }

  static _imports(ipcRenderer) {
    return {
      importModelFromUrl: (args) => ipcRenderer.invoke('core.imageServer.importModelFromUrl', args),
      importModelFromRepo: (args) => ipcRenderer.invoke('core.imageServer.importModelFromRepo', args),
      importModelFromFile: (args) => ipcRenderer.invoke('core.imageServer.importModelFromFile', args),
      pickImportFile: () => ipcRenderer.invoke('core.imageServer.pickImportFile'),
      scanExistingLibraries: (args) => ipcRenderer.invoke('core.imageServer.scanExistingLibraries', args || {}),
      importExistingModel: (args) => ipcRenderer.invoke('core.imageServer.importExistingModel', args),
      pickLibraryDir: () => ipcRenderer.invoke('core.imageServer.pickLibraryDir'),
      getPromptProfiles: () => ipcRenderer.invoke('core.imageServer.getPromptProfiles'),
      listLoras: () => ipcRenderer.invoke('core.imageServer.listLoras'),
      importLora: (args) => ipcRenderer.invoke('core.imageServer.importLora', args || {}),
      loraCatalog: () => ipcRenderer.invoke('core.imageServer.loraCatalog'),
      downloadLora: (args) => ipcRenderer.invoke('core.imageServer.downloadLora', args),
      setModelLoras: (args) => ipcRenderer.invoke('core.imageServer.setModelLoras', args),
    };
  }

  static _server(ipcRenderer, sub) {
    return {
      getDefaults: () => ipcRenderer.invoke('core.imageServer.getDefaults'),
      isRoleReady: (role) => ipcRenderer.invoke('core.imageServer.isRoleReady', role),
      setDefaults: (payload) => ipcRenderer.invoke('core.imageServer.setDefaults', payload),
      getRamPinStatus: () => ipcRenderer.invoke('core.imageServer.getRamPinStatus'),
      getAutoUnloadMs: () => ipcRenderer.invoke('core.imageServer.getAutoUnloadMs'),
      setAutoUnloadMs: (ms) => ipcRenderer.invoke('core.imageServer.setAutoUnloadMs', ms),
      getServerStatus: () => ipcRenderer.invoke('core.imageServer.getServerStatus'),
      startServer: () => ipcRenderer.invoke('core.imageServer.startServer'),
      stopServer: () => ipcRenderer.invoke('core.imageServer.stopServer'),
      onServerEvent: sub('core.imageServer.serverEvent'),
      generate: (args) => ipcRenderer.invoke('core.imageServer.generate', args),
      generateAbort: () => ipcRenderer.invoke('core.imageServer.generateAbort'),
      onImageEvent: sub('core.imageServer.imageEvent'),
    };
  }

  static _video(ipcRenderer, sub) {
    return {
      generate: (args) => ipcRenderer.invoke('core.videoGen.generate', args),
      generateAbort: () => ipcRenderer.invoke('core.videoGen.generateAbort'),
      getServerStatus: () => ipcRenderer.invoke('core.videoGen.getServerStatus'),
      stopServer: () => ipcRenderer.invoke('core.videoGen.stopServer'),
      onVideoEvent: sub('core.videoGen.videoEvent'),
      onServerEvent: sub('core.videoGen.serverEvent'),
    };
  }
}

module.exports = ImageApi;
