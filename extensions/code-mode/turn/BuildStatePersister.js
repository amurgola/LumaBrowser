const SessionSnapshot = require('../SessionSnapshot');

class BuildStatePersister {
  static EVENT = 'build:state';

  constructor({ context, sessions }) {
    this._context = context;
    this._sessions = sessions;
  }

  run({ conversationId, meta, emit, setMeta, aborted }) {
    const s = this._sessions.get(conversationId);
    if (aborted && s && s.workspaceId && s.status !== 'installed') {
      this._discard(s, conversationId);
      BuildStatePersister._publish(meta, null, emit, setMeta);
      return;
    }
    const build = SessionSnapshot.forConversation(this._sessions, conversationId);
    if (build) BuildStatePersister._publish(meta, build, emit, setMeta);
  }

  _discard(s, conversationId) {
    try {
      if (this._context.code && this._context.code.discardWorkspace) this._context.code.discardWorkspace(s.workspaceId);
    } catch (_) {}
    this._sessions.delete(conversationId);
  }

  static _publish(meta, build, emit, setMeta) {
    try { setMeta({ data: { ...((meta && meta.data) || {}), build } }); } catch (_) {}
    try { emit(BuildStatePersister.EVENT, build); } catch (_) {}
  }
}

module.exports = BuildStatePersister;
