const PreloadSection = require('./PreloadSection');

class ChatTurnApi extends PreloadSection {
  static build(ipcRenderer, webUtils) {
    return {
      listModels: () => ipcRenderer.invoke('core.llmServer.listModels'),
      modelSettings: {
        get: (ref) => ipcRenderer.invoke('core.llmServer.modelSettings.get', ref),
        setModel: (ref, payload) => ipcRenderer.invoke('core.llmServer.modelSettings.setModel', ref, payload),
        saveProfile: (input) => ipcRenderer.invoke('core.llmServer.modelSettings.saveProfile', input),
        deleteProfile: (id) => ipcRenderer.invoke('core.llmServer.modelSettings.deleteProfile', id),
      },
      chat2: (args) => ipcRenderer.invoke('core.llmServer.chat2', args),
      pickChatAttachment: () => ipcRenderer.invoke('core.llmServer.chat.pickAttachment'),
      readDroppedAttachments: (files) => ChatTurnApi._readDropped(ipcRenderer, webUtils, files),
      pageContext: {
        listTabs: () => ipcRenderer.invoke('core.llmServer.pageContext.listTabs'),
        readTab: (tabId) => ipcRenderer.invoke('core.llmServer.pageContext.readTab', tabId),
        readDashboard: () => ipcRenderer.invoke('core.llmServer.pageContext.readDashboard'),
      },
      docsSource: {
        status: () => ipcRenderer.invoke('core.llmServer.docsSource.status'),
      },
      onChatEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.chatEvent'),
    };
  }

  static _readDropped(ipcRenderer, webUtils, files) {
    const paths = [];
    for (const f of Array.from(files || [])) {
      try { const p = webUtils.getPathForFile(f); if (p) paths.push(p); } catch (_) {}
    }
    if (!paths.length) return Promise.resolve({ success: true, files: [] });
    return ipcRenderer.invoke('core.llmServer.chat.readAttachments', paths);
  }
}

module.exports = ChatTurnApi;
