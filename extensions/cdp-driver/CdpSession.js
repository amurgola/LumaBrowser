class CdpSession {
  constructor({ sessionId, targetId, connection, flatten = true, llmFallback }) {
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.connection = connection;
    this.flatten = flatten;
    this.llmFallback = llmFallback || { enabled: false };
    this.enabledDomains = new Set();
    this.createdAt = Date.now();
  }
}

module.exports = CdpSession;
