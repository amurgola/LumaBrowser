const PreloadSection = require('./PreloadSection');

class LlmServerApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      ...LlmServerApi._defaults(ipcRenderer),
      ...LlmServerApi._server(ipcRenderer),
      ...LlmServerApi._uiState(ipcRenderer),
      ...LlmServerApi._pushes(ipcRenderer),
    };
  }

  static _defaults(ipcRenderer) {
    return {
      getDefaults: () => ipcRenderer.invoke('core.llmServer.getDefaults'),
      getApprovalPolicy: () => ipcRenderer.invoke('core.llmServer.chat.getApprovalPolicy'),
      setApprovalPolicy: (policy) => ipcRenderer.invoke('core.llmServer.chat.setApprovalPolicy', policy),
      setDefaults: (payload) => ipcRenderer.invoke('core.llmServer.setDefaults', payload),
      getAutoUnloadMs: () => ipcRenderer.invoke('core.llmServer.getAutoUnloadMs'),
      setAutoUnloadMs: (ms) => ipcRenderer.invoke('core.llmServer.setAutoUnloadMs', ms),
      getModelCaps: (modelPath) => ipcRenderer.invoke('core.llmServer.getModelCaps', modelPath),
    };
  }

  static _server(ipcRenderer) {
    return {
      getServerStatus: () => ipcRenderer.invoke('core.llmServer.getServerStatus'),
      getState: () => ipcRenderer.invoke('core.llmServer.getState'),
      openSetup: (opts) => ipcRenderer.invoke('core.llmServer.openSetup', opts),
      getPeerGpus: () => ipcRenderer.invoke('core.llmServer.getPeerGpus'),
      getRamPinStatus: () => ipcRenderer.invoke('core.llmServer.getRamPinStatus'),
      getGroupRouterStatus: () => ipcRenderer.invoke('core.llmServer.getGroupRouterStatus'),
      startServer: () => ipcRenderer.invoke('core.llmServer.startServer'),
      stopServer: () => ipcRenderer.invoke('core.llmServer.stopServer'),
      chatAbort: () => ipcRenderer.invoke('core.llmServer.chatAbort'),
      takeoverRespond: (action) => ipcRenderer.invoke('core.llmServer.chat.takeoverRespond', action),
      approvalRespond: (decision) => ipcRenderer.invoke('core.llmServer.chat.approvalRespond', decision),
    };
  }

  static _uiState(ipcRenderer) {
    return {
      getUiMode: () => ipcRenderer.invoke('core.llmServer.getUiMode'),
      setUiMode: (mode) => ipcRenderer.invoke('core.llmServer.setUiMode', mode),
      consumePendingSetupExpand: () => ipcRenderer.invoke('core.llmServer.consumePendingSetupExpand'),
      getSidebarCollapsed: () => ipcRenderer.invoke('core.llmServer.getSidebarCollapsed'),
      setSidebarCollapsed: (v) => ipcRenderer.invoke('core.llmServer.setSidebarCollapsed', v),
      getLastModelRef: () => ipcRenderer.invoke('core.llmServer.getLastModelRef'),
      setLastModelRef: (ref) => ipcRenderer.invoke('core.llmServer.setLastModelRef', ref),
    };
  }

  static _pushes(ipcRenderer) {
    const sub = (channel, map) => PreloadSection.subscribe(ipcRenderer, channel, map);
    return {
      onServerEvent: sub('core.llmServer.serverEvent'),
      onState: sub('core.llmServer.state'),
      onShowChat: sub('core.llmServer.showChat', () => undefined),
      onShowSetup: sub('core.llmServer.showSetup'),
      onOpenConversation: sub('core.llmServer.openConversation', (_e, conversationId) => conversationId),
    };
  }
}

module.exports = LlmServerApi;
