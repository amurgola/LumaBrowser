const PreloadSection = require('./PreloadSection');

class ChatModesApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      chat: {
        ...ChatModesApi._modes(ipcRenderer),
        workspace: ChatModesApi._workspace(ipcRenderer),
      },
      setup: {
        listTabs: () => ipcRenderer.invoke('core.llmServer.setup.listTabs'),
        invoke: (extId, action, payload) =>
          ipcRenderer.invoke('core.llmServer.setup.invoke', { extId, action, payload }),
      },
    };
  }

  static _modes(ipcRenderer) {
    return {
      listModes: () => ipcRenderer.invoke('core.llmServer.chat.listModes'),
      complete: (args) => ipcRenderer.invoke('core.llmServer.chat.complete', args || {}),
      completeStream: (args) => ipcRenderer.invoke('core.llmServer.chat.completeStream', args || {}),
      completeAbort: (requestId) => ipcRenderer.invoke('core.llmServer.chat.completeAbort', requestId),
      agentTools: () => ipcRenderer.invoke('core.llmServer.chat.agentTools'),
      setGlobalToolEnabled: (name, enabled) =>
        ipcRenderer.invoke('core.llmServer.chat.setGlobalToolEnabled', name, enabled),
      previewSystemPrompt: (opts) => ipcRenderer.invoke('core.llmServer.chat.previewSystemPrompt', opts || {}),
      takeIntent: () => ipcRenderer.invoke('core.llmServer.chat.takeIntent'),
      readWorkspaceFile: (args) => ipcRenderer.invoke('core.llmServer.chat.readWorkspaceFile', args || {}),
    };
  }

  static _workspace(ipcRenderer) {
    return {
      info: (args) => ipcRenderer.invoke('core.llmServer.chat.workspace.info', args || {}),
      list: (args) => ipcRenderer.invoke('core.llmServer.chat.workspace.list', args || {}),
      read: (args) => ipcRenderer.invoke('core.llmServer.chat.workspace.read', args || {}),
      write: (args) => ipcRenderer.invoke('core.llmServer.chat.workspace.write', args || {}),
      create: (args) => ipcRenderer.invoke('core.llmServer.chat.workspace.create', args || {}),
      rename: (args) => ipcRenderer.invoke('core.llmServer.chat.workspace.rename', args || {}),
      remove: (args) => ipcRenderer.invoke('core.llmServer.chat.workspace.remove', args || {}),
    };
  }
}

module.exports = ChatModesApi;
