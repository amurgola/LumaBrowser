const ResponseFormat = require('./ResponseFormat');

class TaskWebhook {
  static TIMEOUT_MS = 10000;

  constructor({ post = null } = {}) {
    this._post = post;
  }

  async send(task, { runId, finalResponse, completedAt }) {
    await this._sender()(task.webhook_url, TaskWebhook.payloadFor(task, { runId, finalResponse, completedAt }), {
      timeout: TaskWebhook.TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  static payloadFor(task, { runId, finalResponse, completedAt }) {
    const parsed = ResponseFormat.parseJson(finalResponse);
    return {
      taskId: task.id,
      taskName: task.name,
      runId,
      requestPrompt: task.request_prompt,
      response: parsed !== undefined ? parsed : finalResponse,
      responseText: finalResponse,
      timestamp: completedAt,
    };
  }

  _sender() {
    return this._post || require('axios').post;
  }
}

module.exports = TaskWebhook;
