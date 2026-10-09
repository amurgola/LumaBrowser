const PreloadSection = require('./PreloadSection');

class ConversationApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      conv: {
        ...ConversationApi._history(ipcRenderer),
        ...ConversationApi._options(ipcRenderer),
        meta: {
          get: (conversationId) => ipcRenderer.invoke('core.llmServer.conv.meta.get', conversationId),
          set: (conversationId, patch) => ipcRenderer.invoke('core.llmServer.conv.meta.set', conversationId, patch),
        },
        artifacts: (conversationId) => ipcRenderer.invoke('core.llmServer.conv.artifacts', conversationId),
        variants: (group) => ipcRenderer.invoke('core.llmServer.conv.variants', group),
        setVariant: (messageId) => ipcRenderer.invoke('core.llmServer.conv.setVariant', messageId),
      },
    };
  }

  static _history(ipcRenderer) {
    return {
      list: (opts) => ipcRenderer.invoke('core.llmServer.conv.list', opts),
      get: (id) => ipcRenderer.invoke('core.llmServer.conv.get', id),
      create: (data) => ipcRenderer.invoke('core.llmServer.conv.create', data),
      rename: (id, title) => ipcRenderer.invoke('core.llmServer.conv.rename', id, title),
      delete: (id) => ipcRenderer.invoke('core.llmServer.conv.delete', id),
      archive: (id, archived) => ipcRenderer.invoke('core.llmServer.conv.archive', id, archived),
      pin: (id, pinned) => ipcRenderer.invoke('core.llmServer.conv.pin', id, pinned),
      messages: (conversationId) => ipcRenderer.invoke('core.llmServer.conv.messages', conversationId),
      export: (conversationId, kind) => ipcRenderer.invoke('core.llmServer.conv.export', conversationId, kind),
      addMessage: (msg) => ipcRenderer.invoke('core.llmServer.conv.addMessage', msg),
      deleteMessage: (id) => ipcRenderer.invoke('core.llmServer.conv.deleteMessage', id),
      updateMessage: (id, patch) => ipcRenderer.invoke('core.llmServer.conv.updateMessage', id, patch),
      clearMessages: (id) => ipcRenderer.invoke('core.llmServer.conv.clearMessages', id),
      search: (q, opts) => ipcRenderer.invoke('core.llmServer.conv.search', q, opts),
      wipeAll: () => ipcRenderer.invoke('core.llmServer.chat.wipeAll'),
      autotitle: (id) => ipcRenderer.invoke('core.llmServer.conv.autotitle', id),
    };
  }

  static _options(ipcRenderer) {
    return {
      setTools: (id, enabled) => ipcRenderer.invoke('core.llmServer.conv.setTools', id, enabled),
      setDisabledTools: (id, names) => ipcRenderer.invoke('core.llmServer.conv.setDisabledTools', id, names),
      setChoices: (id, enabled) => ipcRenderer.invoke('core.llmServer.conv.setChoices', id, enabled),
      setReasoningEffort: (id, position) => ipcRenderer.invoke('core.llmServer.conv.setReasoningEffort', id, position),
    };
  }
}

module.exports = ConversationApi;
