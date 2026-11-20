const BackgroundTaskText = require('./BackgroundTaskText');
const StoredHistory = require('../router/StoredHistory');

class BackgroundTaskTurn {
  static PROVIDER = 'background-task';
  static BUSY = 'busy';

  constructor({ getRouter, followers }) {
    this._getRouter = getRouter;
    this._followers = followers;
  }

  async start(conversationId, tasks, stillRunning = []) {
    const router = this._getRouter();
    const store = router && router.chatStore;
    const conversation = store ? store.getConversation(conversationId) : null;
    if (!conversation) return null;
    const content = BackgroundTaskText.notice(tasks, stillRunning);
    const userNotice = { provider: BackgroundTaskTurn.PROVIDER, toolCalls: BackgroundTaskTurn.rowData(tasks) };
    const send = await this._followers.open({ conversationId, notice: { content, toolCalls: userNotice.toolCalls } });
    if (router.active) return BackgroundTaskTurn.BUSY;
    return router.chat({
      conversationId,
      modelRef: conversation.modelRef || router.resolveModelRef(null),
      messages: [...StoredHistory.messages(store, conversationId), { role: 'user', content }],
      userMessage: content,
      userNotice,
      agent: true,
      reasoningEffort: conversation.reasoningEffort || undefined,
      send,
    });
  }

  static rowData(tasks) {
    const replies = [...new Set(tasks.map((task) => task.batchId))];
    return {
      startedBy: replies.length === 1 ? replies[0] : null,
      backgroundTasks: tasks.map((task) => ({ id: task.id, title: task.title, tool: task.tool, state: task.state, durationMs: task.durationMs, stoppedBy: task.stoppedBy || null })),
      artifacts: tasks.flatMap((task) => task.artifacts || []),
    };
  }
}

module.exports = BackgroundTaskTurn;
