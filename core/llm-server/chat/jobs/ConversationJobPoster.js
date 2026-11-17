const ConversationJobs = require('./ConversationJobs');

class ConversationJobPoster {
  static PROVIDER = 'background-job';
  static POSTED = 'posted';
  static RETRY_MS = 2000;
  static MAX_WAIT_MS = 10 * 60 * 1000;

  constructor({ jobs, getRouter, onPosted = () => {}, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
    this._jobs = jobs;
    this._getRouter = getRouter;
    this._onPosted = onPosted;
    this._sleep = sleep;
  }

  watch() {
    return this._jobs.onEvent((type, payload) => {
      if (type === ConversationJobs.FINISHED) this.post(payload).catch(() => {});
    });
  }

  async post({ conversationId, job, message }) {
    if (!message || !conversationId) return null;
    await this._untilNoTurnStreams();
    const store = this._store();
    if (!store || !store.getConversation(conversationId)) return null;
    const row = store.addMessage({ conversationId, role: 'assistant', content: message, provider: ConversationJobPoster.PROVIDER });
    this._onPosted({ conversationId, jobId: job && job.id, messageId: row && row.id });
    return row;
  }

  async _untilNoTurnStreams() {
    let waited = 0;
    while (this._turnStreaming() && waited < ConversationJobPoster.MAX_WAIT_MS) {
      await this._sleep(ConversationJobPoster.RETRY_MS);
      waited += ConversationJobPoster.RETRY_MS;
    }
  }

  _turnStreaming() {
    const router = this._getRouter();
    return !!(router && router.active);
  }

  _store() {
    const router = this._getRouter();
    return (router && router.chatStore) || null;
  }
}

module.exports = ConversationJobPoster;
