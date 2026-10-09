class AgentNoticeRun {
  constructor(notices, conversationId, startedAt) {
    this._notices = notices;
    this.conversationId = conversationId == null ? null : String(conversationId);
    this.startedAt = startedAt;
  }

  drain() {
    if (this.conversationId) return this._notices.drain(this.conversationId);
    return this._notices.drainIfSoleRun(this);
  }

  end() {
    this._notices.endRun(this);
  }
}

module.exports = AgentNoticeRun;
