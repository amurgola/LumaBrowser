const BuildName = require('./BuildName');
const SessionSnapshot = require('../../SessionSnapshot');

class BuildWorkspace {
  static STATE_EVENT = 'build:state';

  constructor({ code, sessions, conversationId, meta }) {
    this._code = code;
    this._sessions = sessions;
    this._conversationId = conversationId;
    this._meta = meta;
  }

  get code() {
    return this._code;
  }

  current() {
    const s = this._sessions.get(this._conversationId);
    return s && s.workspaceId ? s : null;
  }

  ensure() {
    const existing = this.current();
    if (existing) return existing;
    const handle = this._code.createWorkspace({ name: BuildName.derive(this._meta), overwrite: true });
    const s = { workspaceId: handle.workspaceId, id: handle.id, dir: handle.dir, files: new Map(), status: 'drafting', installedId: null };
    this._sessions.set(this._conversationId, s);
    return s;
  }

  forget() {
    this._sessions.delete(this._conversationId);
  }

  emitState(emit, s) {
    SessionSnapshot.emit(emit, BuildWorkspace.STATE_EVENT, s ? SessionSnapshot.build(s) : null);
  }
}

module.exports = BuildWorkspace;
