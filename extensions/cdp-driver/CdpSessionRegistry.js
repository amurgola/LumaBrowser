class CdpSessionRegistry {
  constructor() {
    this._sessions = new Map();
    this._byTarget = new Map();
  }

  add(session) {
    this._sessions.set(session.sessionId, session);
    this._idsForTarget(session.targetId, true).add(session.sessionId);
    return session;
  }

  get(sessionId) { return this._sessions.get(sessionId) || null; }

  delete(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) return;
    this._sessions.delete(sessionId);
    this._forgetTargetLink(session);
  }

  byTarget(targetId) {
    const ids = this._idsForTarget(targetId, false);
    if (!ids) return [];
    return [...ids].map((id) => this._sessions.get(id)).filter(Boolean);
  }

  byConnection(connection) {
    return this.all().filter((session) => session.connection === connection);
  }

  all() { return [...this._sessions.values()]; }

  clear() {
    this._sessions.clear();
    this._byTarget.clear();
  }

  _idsForTarget(targetId, create) {
    let ids = this._byTarget.get(targetId);
    if (!ids && create) {
      ids = new Set();
      this._byTarget.set(targetId, ids);
    }
    return ids || null;
  }

  _forgetTargetLink(session) {
    const ids = this._byTarget.get(session.targetId);
    if (!ids) return;
    ids.delete(session.sessionId);
    if (ids.size === 0) this._byTarget.delete(session.targetId);
  }
}

module.exports = CdpSessionRegistry;
