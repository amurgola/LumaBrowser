const PreloadSection = require('./PreloadSection');

class MusicApi extends PreloadSection {
  static build(ipcRenderer) {
    const sub = (channel) => PreloadSection.subscribe(ipcRenderer, channel);
    return {
      music: {
        ...MusicApi._setup(ipcRenderer),
        onRuntimeEvent: sub('core.musicServer.runtimeEvent'),
        onModelEvent: sub('core.musicServer.modelEvent'),
        gen: {
          generate: (args) => ipcRenderer.invoke('core.musicGen.generate', args),
          generateAbort: () => ipcRenderer.invoke('core.musicGen.generateAbort'),
          getServerStatus: () => ipcRenderer.invoke('core.musicGen.getServerStatus'),
          stopServer: () => ipcRenderer.invoke('core.musicGen.stopServer'),
          onMusicEvent: sub('core.musicGen.musicEvent'),
          onServerEvent: sub('core.musicGen.serverEvent'),
        },
      },
    };
  }

  static _setup(ipcRenderer) {
    return {
      getView: (opts) => ipcRenderer.invoke('core.musicServer.getView', opts || {}),
      getWslStatus: () => ipcRenderer.invoke('core.musicServer.getWslStatus'),
      installRuntime: (id) => ipcRenderer.invoke('core.musicServer.installRuntime', id),
      cancelInstall: () => ipcRenderer.invoke('core.musicServer.cancelInstall'),
      uninstallRuntime: (id) => ipcRenderer.invoke('core.musicServer.uninstallRuntime', id),
      checkRuntimeUpdates: (opts) => ipcRenderer.invoke('core.musicServer.checkRuntimeUpdates', opts || {}),
      getModelsView: () => ipcRenderer.invoke('core.musicServer.getModelsView'),
      downloadModel: (modelId) => ipcRenderer.invoke('core.musicServer.downloadModel', modelId),
      cancelDownload: () => ipcRenderer.invoke('core.musicServer.cancelDownload'),
      deleteModel: (modelId) => ipcRenderer.invoke('core.musicServer.deleteModel', modelId),
      getDefaults: () => ipcRenderer.invoke('core.musicServer.getDefaults'),
      setDefaults: (patch) => ipcRenderer.invoke('core.musicServer.setDefaults', patch),
      setEnabled: (enabled) => ipcRenderer.invoke('core.musicServer.setEnabled', enabled),
      getStatus: () => ipcRenderer.invoke('core.musicServer.getStatus'),
      stopServer: () => ipcRenderer.invoke('core.musicServer.stopServer'),
    };
  }
}

module.exports = MusicApi;
