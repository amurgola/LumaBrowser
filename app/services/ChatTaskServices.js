const path = require('path');
const ArtifactStore = require('../../core/llm-server/chat/ArtifactStore');
const ArtifactDataStore = require('../../core/llm-server/chat/ArtifactDataStore');
const LiveApi = require('../../core/llm-server/chat/LiveApi');
const BackgroundRunGate = require('../../core/llm-server/chat/BackgroundRunGate');
const ArtifactTaskStore = require('../../core/llm-server/chat/ArtifactTaskStore');
const ArtifactTaskScheduler = require('../../core/llm-server/chat/ArtifactTaskScheduler');
const ScheduledTaskStore = require('../../core/llm-server/chat/ScheduledTaskStore');
const ScheduledTaskScheduler = require('../../core/llm-server/chat/ScheduledTaskScheduler');
const ScheduledTaskMode = require('../../core/llm-server/chat/ScheduledTaskMode');
const RagService = require('../../core/rag/RagService');
const DocsKnowledgeBase = require('../../core/rag/DocsKnowledgeBase');
const AppGlobals = require('../AppGlobals');

class ChatTaskServices {
  static DASHBOARD_TASKS_CHANNEL = 'core.dashboard.tasks.event';
  static SCHEDULED_TASKS_CHANNEL = 'core.llmServer.schedTasks.event';

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._db = ctx.services.db;
  }

  build() {
    this._buildArtifacts();
    this._s.backgroundRunGate = new BackgroundRunGate();
    this._buildArtifactTasks();
    this._buildScheduledTasks();
    this._s.ragService = AppGlobals.publish('__lumaRagService', new RagService({ dataDir: this._ctx.dataDir }));
    this._s.docsKnowledgeBase = AppGlobals.publish('__lumaDocsKnowledgeBase', new DocsKnowledgeBase({ dbPath: this._docsIndexPath() }));
    return this._s;
  }

  _docsIndexPath() {
    const ctx = this._ctx;
    return DocsKnowledgeBase.resolvePath({
      isPackaged: !!(ctx.app && ctx.app.isPackaged),
      resourcesPath: ctx.proc ? ctx.proc.resourcesPath : null,
      rootDir: ctx.rootDir,
    });
  }

  _buildArtifacts() {
    this._s.artifactStore = new ArtifactStore({
      settingsDb: this._db,
      artifactsDir: path.join(this._ctx.dataDir, 'artifacts'),
      getWebBase: () => this._ctx.webBase(),
    });
    this._s.artifactDataStore = new ArtifactDataStore({ settingsDb: this._db });
    this._s.liveApi = new LiveApi({ getAgentDeps: () => this._ctx.agentDeps, getExtensionManager: () => this._s.extensionManager });
  }

  _buildArtifactTasks() {
    this._s.artifactTaskStore = new ArtifactTaskStore({ settingsDb: this._db });
    this._s.artifactTaskScheduler = new ArtifactTaskScheduler({
      taskStore: this._s.artifactTaskStore,
      artifactDataStore: this._s.artifactDataStore,
      settingsDb: this._db,
      getAgentDeps: () => this._ctx.agentDeps,
      getRouter: () => global.__lumaChatRouter,
      emitEvent: this._ctx.renderers.emitter(ChatTaskServices.DASHBOARD_TASKS_CHANNEL),
      gate: this._s.backgroundRunGate,
    });
  }

  _buildScheduledTasks() {
    this._s.scheduledTaskStore = new ScheduledTaskStore({ settingsDb: this._db });
    this._s.emitSchedTasksEvent = this._ctx.renderers.emitter(ChatTaskServices.SCHEDULED_TASKS_CHANNEL);
    this._s.scheduledTaskScheduler = new ScheduledTaskScheduler({
      taskStore: this._s.scheduledTaskStore,
      settingsDb: this._db,
      getAgentDeps: () => this._ctx.agentDeps,
      getRouter: () => global.__lumaChatRouter,
      emitEvent: this._s.emitSchedTasksEvent,
      gate: this._s.backgroundRunGate,
    });
    new ScheduledTaskMode({
      taskStore: this._s.scheduledTaskStore,
      getScheduler: () => this._s.scheduledTaskScheduler,
      getChatStore: ChatTaskServices.chatStore,
      emitEvent: this._s.emitSchedTasksEvent,
    }).register();
  }

  static chatStore() {
    const router = global.__lumaChatRouter;
    return (router && router.chatStore) || null;
  }
}

module.exports = ChatTaskServices;
