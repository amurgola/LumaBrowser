const SessionSnapshot = require('../../SessionSnapshot');

class ProjectWorkspace {
  static STATE_EVENT = 'project:state';

  constructor({ code, sessions, conversationId, meta }) {
    this._code = code;
    this._sessions = sessions;
    this._conversationId = conversationId;
    this._projectPath = meta && meta.data && meta.data.projectPath;
  }

  get code() {
    return this._code;
  }

  get projectPath() {
    return this._projectPath;
  }

  get conversationId() {
    return this._conversationId;
  }

  current() {
    return this._sessions.get(this._conversationId);
  }

  ensure() {
    const existing = this.current();
    if (existing && existing.workspaceId) return existing;
    const handle = this._code.openProject({ path: this._projectPath });
    const s = {
      workspaceId: handle.workspaceId, id: handle.id, dir: handle.dir, kind: 'project',
      files: new Map(), readWhole: new Map(), calls: 0, served: 0, status: 'editing',
    };
    this._sessions.set(this._conversationId, s);
    return s;
  }

  begin() {
    const s = this.ensure();
    s.calls = (s.calls || 0) + 1;
    return s;
  }

  trackFile(s, relPath, ok) {
    s.files.set(relPath, { ok, phase: 'done' });
    if (s.readWhole) s.readWhole.delete(relPath);
  }

  emitState(emit, s) {
    SessionSnapshot.emit(emit, ProjectWorkspace.STATE_EVENT, SessionSnapshot.project(s));
  }

  recordServed(result) {
    const s = this.current();
    if (s && result && typeof result.message === 'string') s.served += result.message.length;
  }
}

module.exports = ProjectWorkspace;
