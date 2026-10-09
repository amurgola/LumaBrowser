const ChatModeRegistry = require('../chat/ChatModeRegistry');
const ConversationArtifactPurge = require('../chat/ConversationArtifactPurge');
const LlmTrace = require('../chat/LlmTrace');
const ToolResultSpill = require('../chat/ToolResultSpill');

class ConversationDeletion {
  constructor({
    llmServerService, deps, schedTasks, triggers, workspaceFiles,
    modeRegistry = ChatModeRegistry.shared, spill = ToolResultSpill, trace = LlmTrace,
  }) {
    this._svc = llmServerService;
    this._deps = deps;
    this._schedTasks = schedTasks;
    this._triggers = triggers;
    this._workspace = workspaceFiles;
    this._modes = modeRegistry;
    this._spill = spill;
    this._trace = trace;
  }

  delete(id) {
    this._schedTasks.deleteOwnedBy(id);
    this._triggers.deleteOwnedBy(id);
    this._purgeArtifacts(id);
    this._notifyMode(id);
    this._deleteSpillAndTrace(id);
    return { success: this._svc.chatStore.deleteConversation(id) };
  }

  _purgeArtifacts(id) {
    try {
      new ConversationArtifactPurge({
        conversationId: id,
        artifactStore: this._deps.artifactStore(),
        artifactDataStore: this._deps.get('artifactDataStore'),
        artifactTaskStore: this._deps.get('artifactTaskStore'),
        pinnedRootIds: this._pinnedRootIds(),
      }).execute();
    } catch (_) {}
  }

  _pinnedRootIds() {
    try {
      const dashboard = this._deps.get('dashboardService');
      return dashboard ? dashboard.getLayout().map((item) => item.rootId) : [];
    } catch (_) {
      return [];
    }
  }

  _notifyMode(id) {
    try { this._modes.notifyConversationDeleted(this._svc.chatStore.getMeta(id)); } catch (_) {}
  }

  _deleteSpillAndTrace(id) {
    try {
      this._spill.deleteFor(id, { workspaceRoot: this._workspaceRoot(id) });
      this._trace.deleteFor(id);
    } catch (_) {}
  }

  _workspaceRoot(id) {
    try {
      const info = this._workspace.resolveRoot(id);
      return info ? info.root : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ConversationDeletion;
