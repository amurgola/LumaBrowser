const IpcSubscription = require('../../shared/ipc/IpcSubscription');

class DashboardPreloadApi {
  static GLOBAL_NAME = 'dashboardAPI';
  static EXTENSION_ID_PATTERN = /^[a-z0-9-]+$/;
  static EXT_EVENT_SUFFIX = '.dashboard.event';

  static expose(contextBridge, ipcRenderer) {
    try {
      contextBridge.exposeInMainWorld(DashboardPreloadApi.GLOBAL_NAME, DashboardPreloadApi.build(ipcRenderer));
    } catch (err) {
      console.error('[dashboard-tab-preload] failed to expose dashboardAPI', err);
    }
  }

  static build(ipcRenderer) {
    const invoke = (channel, arity) => (...args) => ipcRenderer.invoke(channel, ...args.slice(0, arity));
    const sub = (channel) => IpcSubscription.of(ipcRenderer, channel);
    return {
      widgets: { listLive: invoke('core.dashboard.widgets.listLive', 0), setHidden: invoke('core.dashboard.widgets.setHidden', 2) },
      artifact: { get: invoke('core.llmServer.artifact.get', 1) },
      layout: { get: invoke('core.dashboard.layout.get', 0), set: invoke('core.dashboard.layout.set', 1) },
      artifactData: DashboardPreloadApi._artifactData(invoke, sub),
      liveApi: DashboardPreloadApi._liveApi(invoke, ipcRenderer),
      ext: DashboardPreloadApi._ext(invoke, ipcRenderer),
      tasks: DashboardPreloadApi._tasks(invoke, sub),
      onPinned: sub('core.dashboard.pinned'),
      openChat: invoke('core.dashboard.openChat', 1),
    };
  }

  static _artifactData(invoke, sub) {
    return {
      all: invoke('core.llmServer.artifactData.all', 1),
      mutate: invoke('core.llmServer.artifactData.mutate', 2),
      onChanged: sub('core.llmServer.artifactData.changed'),
    };
  }

  static _liveApi(invoke, ipcRenderer) {
    return {
      fetchPage: invoke('core.llmServer.liveApi.fetch', 1),
      openTab: invoke('core.llmServer.liveApi.openTab', 1),
      extCall: invoke('core.llmServer.liveApi.extCall', 1),
      onExtEvent: DashboardPreloadApi._extEvents(ipcRenderer),
    };
  }

  static _ext(invoke, ipcRenderer) {
    return {
      call: invoke('core.dashboard.ext.call', 3),
      onEvent: DashboardPreloadApi._extEvents(ipcRenderer),
    };
  }

  static _extEvents(ipcRenderer) {
    return (extensionId, cb) => {
      const id = String(extensionId || '');
      if (!DashboardPreloadApi.EXTENSION_ID_PATTERN.test(id)) throw new Error('extensionId required');
      return IpcSubscription.of(ipcRenderer, `ext.${id}${DashboardPreloadApi.EXT_EVENT_SUFFIX}`)(cb);
    };
  }

  static _tasks(invoke, sub) {
    return {
      list: invoke('core.dashboard.tasks.list', 1),
      create: invoke('core.dashboard.tasks.create', 1),
      update: invoke('core.dashboard.tasks.update', 2),
      setEnabled: invoke('core.dashboard.tasks.setEnabled', 2),
      delete: invoke('core.dashboard.tasks.delete', 1),
      runNow: invoke('core.dashboard.tasks.runNow', 1),
      runs: invoke('core.dashboard.tasks.runs', 2),
      runTranscript: invoke('core.dashboard.tasks.runTranscript', 1),
      onEvent: sub('core.dashboard.tasks.event'),
    };
  }
}

module.exports = DashboardPreloadApi;
