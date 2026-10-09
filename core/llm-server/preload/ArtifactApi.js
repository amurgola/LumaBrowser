const PreloadSection = require('./PreloadSection');

class ArtifactApi extends PreloadSection {
  static EXTENSION_ID_PATTERN = /^[a-z0-9-]+$/;
  static EXT_EVENT_SUFFIX = '.dashboard.event';

  static build(ipcRenderer) {
    return {
      share: {
        status: () => ipcRenderer.invoke('core.sharing.shareLink.status'),
        create: (kind, targetId, title) =>
          ipcRenderer.invoke('core.sharing.shareLink.create', { kind, targetId, title }),
      },
      artifact: ArtifactApi._artifact(ipcRenderer),
      openDashboard: () => ipcRenderer.invoke('core.dashboard.open'),
      pinToDashboard: (rootId) => ipcRenderer.invoke('core.dashboard.pin', rootId),
      ...ArtifactApi._liveModules(ipcRenderer),
    };
  }

  static _artifact(ipcRenderer) {
    return {
      open: (id) => ipcRenderer.invoke('core.llmServer.artifact.open', id),
      get: (id) => ipcRenderer.invoke('core.llmServer.artifact.get', id),
      listAll: (opts) => ipcRenderer.invoke('core.llmServer.artifact.listAll', opts),
      versions: (idOrRootId) => ipcRenderer.invoke('core.llmServer.artifact.versions', idOrRootId),
      delete: (id) => ipcRenderer.invoke('core.llmServer.artifact.delete', id),
      deleteRoot: (idOrRootId) => ipcRenderer.invoke('core.llmServer.artifact.deleteRoot', idOrRootId),
    };
  }

  static _liveModules(ipcRenderer) {
    return {
      artifactData: {
        all: (idOrRootId) => ipcRenderer.invoke('core.llmServer.artifactData.all', idOrRootId),
        mutate: (idOrRootId, ops) => ipcRenderer.invoke('core.llmServer.artifactData.mutate', idOrRootId, ops),
        onChanged: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.artifactData.changed'),
      },
      liveApi: {
        fetchPage: (params) => ipcRenderer.invoke('core.llmServer.liveApi.fetch', params),
        openTab: (params) => ipcRenderer.invoke('core.llmServer.liveApi.openTab', params),
        extCall: (params) => ipcRenderer.invoke('core.llmServer.liveApi.extCall', params),
        onExtEvent: ArtifactApi._extEvents(ipcRenderer),
      },
    };
  }

  static _extEvents(ipcRenderer) {
    return (extensionId, cb) => {
      const id = String(extensionId || '');
      if (!ArtifactApi.EXTENSION_ID_PATTERN.test(id)) throw new Error('extensionId required');
      return PreloadSection.subscribe(ipcRenderer, `ext.${id}${ArtifactApi.EXT_EVENT_SUFFIX}`)(cb);
    };
  }
}

module.exports = ArtifactApi;
