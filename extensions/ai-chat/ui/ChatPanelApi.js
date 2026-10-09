export default class ChatPanelApi {
  static build(bridge) {
    ChatPanelApi._requireBridge(bridge);
    const inv = (channel) => (...args) => bridge.invoke(channel, ...args);
    const sub = (channel) => (cb) => bridge.on(channel, (payload) => cb(payload));
    return {
      ...ChatPanelApi._serverSurface(inv, sub),
      conv: ChatPanelApi._conversationSurface(inv),
      chat: ChatPanelApi._chatSurface(inv),
      artifact: ChatPanelApi._artifactSurface(inv),
      artifactData: {
        all: inv('core.llmServer.artifactData.all'),
        mutate: inv('core.llmServer.artifactData.mutate'),
        onChanged: sub('core.llmServer.artifactData.changed'),
      },
      getLastModelRef: inv('core.llmServer.getLastModelRef'),
      setLastModelRef: inv('core.llmServer.setLastModelRef'),
      openDashboard: inv('core.dashboard.open'),
      pinToDashboard: inv('core.dashboard.pin'),
    };
  }

  static _requireBridge(bridge) {
    if (!bridge || typeof bridge.invoke !== 'function' || typeof bridge.on !== 'function') {
      throw new Error('ChatPanelApi.build: an ipcBridge with invoke/on is required');
    }
  }

  static _serverSurface(inv, sub) {
    return {
      getDefaults: inv('core.llmServer.getDefaults'),
      listModels: inv('core.llmServer.listModels'),
      getState: inv('core.llmServer.getState'),
      onState: sub('core.llmServer.state'),
      openSetup: inv('core.llmServer.openSetup'),
      chat2: inv('core.llmServer.chat2'),
      chatAbort: inv('core.llmServer.chatAbort'),
      pickChatAttachment: inv('core.llmServer.chat.pickAttachment'),
      onChatEvent: sub('core.llmServer.chatEvent'),
      onOpenConversation: sub('core.llmServer.openConversation'),
    };
  }

  static _conversationSurface(inv) {
    const conv = {};
    for (const name of ChatPanelApi.CONVERSATION_METHODS) conv[name] = inv(`core.llmServer.conv.${name}`);
    conv.meta = { get: inv('core.llmServer.conv.meta.get'), set: inv('core.llmServer.conv.meta.set') };
    return conv;
  }

  static _chatSurface(inv) {
    const chat = {};
    for (const name of ChatPanelApi.CHAT_METHODS) chat[name] = inv(`core.llmServer.chat.${name}`);
    return chat;
  }

  static _artifactSurface(inv) {
    const artifact = {};
    for (const name of ChatPanelApi.ARTIFACT_METHODS) artifact[name] = inv(`core.llmServer.artifact.${name}`);
    return artifact;
  }

  static CONVERSATION_METHODS = [
    'list', 'get', 'create', 'rename', 'delete', 'archive', 'pin', 'messages', 'addMessage', 'deleteMessage',
    'updateMessage', 'clearMessages', 'search', 'autotitle', 'setTools', 'setDisabledTools', 'setChoices',
    'artifacts', 'variants', 'setVariant',
  ];

  static CHAT_METHODS = [
    'listModes', 'complete', 'completeStream', 'completeAbort', 'agentTools', 'previewSystemPrompt', 'takeIntent',
    'approvalRespond', 'takeoverRespond',
  ];

  static ARTIFACT_METHODS = ['open', 'get', 'listAll', 'versions', 'delete', 'deleteRoot'];
}
