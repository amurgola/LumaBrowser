const PreloadSection = require('./PreloadSection');

class ChatTasksApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      schedTasks: ChatTasksApi._schedTasks(ipcRenderer),
      onSchedTasksEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.schedTasks.event'),
      triggers: ChatTasksApi._triggers(ipcRenderer),
      onTriggersEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.triggers.event'),
    };
  }

  static _schedTasks(ipcRenderer) {
    return {
      list: () => ipcRenderer.invoke('core.llmServer.schedTasks.list'),
      get: (id) => ipcRenderer.invoke('core.llmServer.schedTasks.get', id),
      runs: (taskId, opts) => ipcRenderer.invoke('core.llmServer.schedTasks.runs', taskId, opts),
      update: (id, patch) => ipcRenderer.invoke('core.llmServer.schedTasks.update', id, patch),
      delete: (id) => ipcRenderer.invoke('core.llmServer.schedTasks.delete', id),
      runNow: (id) => ipcRenderer.invoke('core.llmServer.schedTasks.runNow', id),
    };
  }

  static _triggers(ipcRenderer) {
    return {
      list: () => ipcRenderer.invoke('core.llmServer.triggers.list'),
      get: (id) => ipcRenderer.invoke('core.llmServer.triggers.get', id),
      runs: (triggerId, opts) => ipcRenderer.invoke('core.llmServer.triggers.runs', triggerId, opts),
      deliveries: (triggerId, opts) => ipcRenderer.invoke('core.llmServer.triggers.deliveries', triggerId, opts),
      update: (id, patch) => ipcRenderer.invoke('core.llmServer.triggers.update', id, patch),
      delete: (id) => ipcRenderer.invoke('core.llmServer.triggers.delete', id),
      test: (id) => ipcRenderer.invoke('core.llmServer.triggers.test', id),
      simulate: (id, body) => ipcRenderer.invoke('core.llmServer.triggers.simulate', id, body),
      pickFile: (id) => ipcRenderer.invoke('core.llmServer.triggers.pickFile', id),
      adoptLatestEvent: (id) => ipcRenderer.invoke('core.llmServer.triggers.adoptLatestEvent', id),
      approve: (runId, decision) => ipcRenderer.invoke('core.llmServer.triggers.approve', runId, decision),
      setSecret: (id, value) => ipcRenderer.invoke('core.llmServer.triggers.setSecret', id, value),
      replay: (runId) => ipcRenderer.invoke('core.llmServer.triggers.replay', runId),
      versions: (triggerId) => ipcRenderer.invoke('core.llmServer.triggers.versions', triggerId),
      persistedTabs: () => ipcRenderer.invoke('core.llmServer.triggers.persistedTabs'),
      clearMemory: (triggerId) => ipcRenderer.invoke('core.llmServer.triggers.clearMemory', triggerId),
      rollback: (triggerId, n) => ipcRenderer.invoke('core.llmServer.triggers.rollback', triggerId, n),
    };
  }
}

module.exports = ChatTasksApi;
