const PtySession = require('./PtySession');

class PtySessionTable {
  static MAX_SESSIONS = 24;
  static SESSION_METHODS = Object.freeze({ snapshot: 'snapshot', info: 'info', run: 'run', read: 'read', send: 'send' });
  static SESSION_POSTS = Object.freeze({ write: (s, p) => s.write(p.data), resize: (s, p) => s.resize(p), ack: (s, p) => s.ack(p.chars), viewed: (s, p) => s.setViewed(p.viewed) });

  constructor({ pty, xterm, emit }) {
    this._pty = pty;
    this._xterm = xterm;
    this._emit = emit;
    this._sessions = new Map();
  }

  async handle(method, params = {}) {
    if (method === 'open') return this._open(params);
    if (method === 'list') return [...this._sessions.values()].map((session) => session.info());
    if (method === 'close') return this._close(params.id);
    const name = PtySessionTable.SESSION_METHODS[method];
    if (!name) throw new Error(`Unknown terminal host method: ${method}`);
    return this._session(params.id)[name](params);
  }

  post(method, params = {}) {
    const apply = PtySessionTable.SESSION_POSTS[method];
    const session = this._sessions.get(params.id);
    if (apply && session) apply(session, params);
  }

  shutdown() {
    for (const session of this._sessions.values()) session.dispose();
    this._sessions.clear();
  }

  _open(params) {
    this._makeRoom();
    const session = new PtySession({
      id: params.id, pty: this._pty, xterm: this._xterm, launch: params.launch, size: params.size,
      emit: (type, payload) => this._emit({ type, sessionId: params.id, ...payload }),
    });
    const info = session.start();
    this._sessions.set(params.id, session);
    return info;
  }

  _makeRoom() {
    if (this._sessions.size < PtySessionTable.MAX_SESSIONS) return;
    const exited = [...this._sessions.values()].find((session) => session.info().exited);
    if (!exited) throw new Error(`Too many terminals are open (${PtySessionTable.MAX_SESSIONS}). Close one first.`);
    this._close(exited.id);
  }

  _close(id) {
    const session = this._sessions.get(id);
    if (!session) return { closed: false };
    session.dispose();
    this._sessions.delete(id);
    return { closed: true };
  }

  _session(id) {
    const session = this._sessions.get(id);
    if (!session) throw new Error(`No terminal with id ${id}. terminal_list shows the open ones.`);
    return session;
  }
}

module.exports = PtySessionTable;
