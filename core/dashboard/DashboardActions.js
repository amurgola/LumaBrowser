const ExtensionApiCall = require('../shell/extensions/ExtensionApiCall');
const ExtensionWidgetCatalog = require('./ExtensionWidgetCatalog');

class DashboardActions {
  static PINNED_CHANNEL = 'core.dashboard.pinned';
  static OPEN_CONVERSATION_CHANNEL = 'core.llmServer.openConversation';

  constructor({ dashboardService, getAgentDeps, llmServerService, artifactTaskStore, artifactTaskScheduler, getChatStore, getExtensionManager } = {}) {
    this._dashboard = dashboardService;
    this._agentDeps = typeof getAgentDeps === 'function' ? getAgentDeps : () => null;
    this._extensions = typeof getExtensionManager === 'function' ? getExtensionManager : () => null;
    this._extensionWidgets = new ExtensionWidgetCatalog(this._extensions);
    this._llmServer = llmServerService || null;
    this._taskStore = artifactTaskStore || null;
    this._scheduler = artifactTaskScheduler || null;
    this._chatStore = typeof getChatStore === 'function' ? getChatStore : () => null;
  }

  hasTasks() {
    return !!this._taskStore;
  }

  open() {
    const tabId = this._dashboard.ensureTab({ activate: true });
    return { success: tabId != null, tabId };
  }

  pin(rootId) {
    const rid = String(rootId || '').trim();
    if (!rid) return { success: false, error: 'rootId required' };
    const pinned = this._dashboard.pinWidget(rid);
    const wasOpen = this._dashboard.getTabId() != null;
    const tabId = this._dashboard.ensureTab({ activate: true });
    if (pinned.added && wasOpen && tabId != null) this._notifyPinned(tabId, rid, pinned.item);
    return { success: true, added: pinned.added, tabId };
  }

  listLiveWidgets() {
    const deps = this._agentDeps();
    const hasStore = !!(deps && deps.artifactStore && typeof deps.artifactStore.listLiveRoots === 'function');
    return {
      success: true,
      widgets: hasStore ? deps.artifactStore.listLiveRoots() : [],
      extensionWidgets: this._extensionWidgets.list(),
      hidden: hasStore ? this._dashboard.getHiddenWidgets() : [],
    };
  }

  callExtension(extensionId, method, args) {
    return ExtensionApiCall.invoke(this._extensions(), extensionId, method, args);
  }

  setWidgetHidden(rootId, hidden) {
    return { success: true, hidden: this._dashboard.setWidgetHidden(rootId, hidden) };
  }

  getLayout() {
    return { success: true, layout: this._dashboard.getLayout() };
  }

  setLayout(items) {
    return { success: true, layout: this._dashboard.setLayout(items) };
  }

  listTasks(rootId) {
    return { success: true, tasks: rootId ? this._taskStore.listByRoot(rootId) : this._taskStore.list() };
  }

  createTask(args = {}) {
    return { success: true, task: this._taskStore.create(args) };
  }

  updateTask(id, patch) {
    const task = this._taskStore.update(id, patch || {});
    return task ? { success: true, task } : { success: false, error: 'task not found' };
  }

  setTaskEnabled(id, enabled) {
    return this.updateTask(id, { enabled: !!enabled });
  }

  deleteTask(id) {
    return { success: this._taskStore.delete(id) };
  }

  async runTaskNow(id) {
    if (!this._scheduler) return { success: false, error: 'scheduler not available' };
    return this._scheduler.runNow(id);
  }

  listTaskRuns(taskId, opts) {
    return { success: true, runs: this._taskStore.listRuns(taskId, opts || {}) };
  }

  runTranscript(runId) {
    const run = this._taskStore.getRun(runId);
    if (!run) return { success: false, error: 'run not found' };
    if (!run.conversationId) return { success: false, error: 'this run\'s transcript was pruned' };
    const store = this._chatStore();
    if (!store) return { success: false, error: 'chat history is not available' };
    return { success: true, run, messages: store.listActiveMessages(run.conversationId) || [] };
  }

  openChat(conversationId) {
    if (!this._llmServer || !this._llmServer.openChat) return { success: false, error: 'Chat is not available.' };
    const opened = this._llmServer.openChat();
    if (opened && conversationId && this._llmServer.tabViewManager) this._deepLinkConversation(conversationId);
    return { success: opened };
  }

  _notifyPinned(tabId, rootId, item) {
    if (!this._dashboard.tabViewManager) return;
    DashboardActions._sendTo(
      () => this._dashboard.tabViewManager.getWebContents(tabId),
      DashboardActions.PINNED_CHANNEL,
      { rootId, pos: item },
    );
  }

  _deepLinkConversation(conversationId) {
    DashboardActions._sendTo(
      () => this._llmServer.tabViewManager.getWebContents(this._llmServer.pinnedTabId),
      DashboardActions.OPEN_CONVERSATION_CHANNEL,
      String(conversationId),
    );
  }

  static _sendTo(resolveWebContents, channel, payload) {
    try {
      const wc = resolveWebContents();
      if (wc && !wc.isDestroyed()) wc.send(channel, payload);
    } catch (_) {}
  }
}

module.exports = DashboardActions;
