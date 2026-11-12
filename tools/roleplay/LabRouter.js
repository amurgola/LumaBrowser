const path = require('path');

class LabRouter {
  static CORE = path.join(__dirname, '..', '..', 'core');

  static build({ service, mode, dispatcher = null, db = LabRouter.settingsDb() }) {
    const UnifiedChatRouter = LabRouter.core('llm-server/chat/UnifiedChatRouter');
    const ChatModeRegistry = LabRouter.core('llm-server/chat/ChatModeRegistry');
    const registry = new ChatModeRegistry();
    if (mode) registry.register(mode, 'roleplay-mode');
    const previous = global.__lumaChatRouter || null;
    const router = new UnifiedChatRouter({
      llmServerService: service,
      db,
      getAgentDeps: () => null,
      agentBridge: LabRouter.bridgeStub(),
      modeRegistry: registry,
      dispatcher: dispatcher || LabRouter.localDispatcher({ service, db }),
    });
    return {
      router,
      registry,
      chatStore: service.chatStore,
      close() {
        if (global.__lumaChatRouter === router) global.__lumaChatRouter = previous;
        try { if (service.chatStore && service.chatStore.db) service.chatStore.db.close(); } catch (_) {}
      },
    };
  }

  static chatStore() {
    const Database = require('better-sqlite3');
    const ChatStore = LabRouter.core('llm-server/ChatStore');
    const ChatTablesSchema = LabRouter.core('database/settings/schema/ChatTablesSchema');
    const db = new Database(':memory:');
    db.exec(ChatTablesSchema.SQL);
    db.exec(ChatTablesSchema.POST_MIGRATION_SQL);
    return new ChatStore({ db });
  }

  static localDispatcher({ service, db }) {
    const ModelDispatcher = LabRouter.core('llm-server/chat/router/ModelDispatcher');
    const LocalStream = LabRouter.core('llm-server/chat/router/LocalStream');
    const LocalRequest = LabRouter.core('llm-server/chat/router/LocalRequest');
    const LlmRuntimeCatalog = LabRouter.core('llm-server/runtimes/LlmRuntimeCatalog');
    const ChatAdapterRegistry = LabRouter.core('llm-server/server/chat/ChatAdapterRegistry');
    const HelperStream = LabRouter.core('llm-server/chat/router/HelperStream');
    const request = new LocalRequest({ llmServerService: service, runtimeCatalog: LlmRuntimeCatalog.shared, adapterRegistry: ChatAdapterRegistry });
    const localStream = new LocalStream({ llmServerService: service, prep: { prepare: async () => {} }, request });
    const remoteStream = { stream: () => { throw new Error('the Roleplay Lab serves local models only'); } };
    const helperStream = service.helperModel
      ? new HelperStream({ helper: service.helperModel, runtimeCatalog: LlmRuntimeCatalog.shared, adapterRegistry: ChatAdapterRegistry })
      : null;
    return new ModelDispatcher({ db, localStream, remoteStream, helperStream, modelSettings: null });
  }

  static settingsDb(initial = {}) {
    const store = new Map(Object.entries(initial));
    return {
      get: (k, d) => (store.has(k) ? store.get(k) : d),
      set: (k, v) => { store.set(k, v); },
      delete: (k) => { store.delete(k); },
      has: (k) => store.has(k),
    };
  }

  static bridgeStub() {
    return {
      abort() {},
      isAborted: () => false,
      run: () => { throw new Error('the Roleplay Lab runs no agent turns'); },
      onRunProgress: () => () => {},
      respondTakeover: () => false,
      respondApproval: () => false,
      addApprovalPresenter: () => () => {},
      addTakeoverPresenter: () => () => {},
    };
  }

  static core(rel) {
    return require(path.join(LabRouter.CORE, rel));
  }
}

module.exports = LabRouter;
