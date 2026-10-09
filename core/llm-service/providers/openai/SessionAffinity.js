class SessionAffinity {
  static headers(sessionId) {
    if (!sessionId) return {};
    return {
      session_id: sessionId,
      'x-session-affinity': sessionId,
      'x-client-request-id': sessionId,
    };
  }
}

module.exports = SessionAffinity;
