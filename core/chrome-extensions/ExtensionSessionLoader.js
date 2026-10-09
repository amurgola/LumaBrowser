const { session, webContents } = require('electron');

class ExtensionSessionLoader {
  static LOAD_OPTIONS = { allowFileAccess: true };
  static QUIET_FAILURE = /already loaded|ENOENT/i;

  constructor() {
    this._sessions = new Set();
    this._loadedIds = new WeakMap();
  }

  track(sess) {
    this._sessions.add(sess);
    this._loadedFor(sess);
  }

  async loadIntoDefault(extPath) {
    const defaultSession = session.defaultSession;
    const loaded = await defaultSession.loadExtension(extPath, ExtensionSessionLoader.LOAD_OPTIONS);
    this.track(defaultSession);
    this._loadedFor(defaultSession).add(loaded.id);
    return loaded;
  }

  async loadInto(sess, extPath, expectedId) {
    if (expectedId && this._loadedFor(sess).has(expectedId)) return false;
    try {
      const loaded = await sess.loadExtension(extPath, ExtensionSessionLoader.LOAD_OPTIONS);
      this._loadedFor(sess).add(loaded.id);
      return true;
    } catch (err) {
      ExtensionSessionLoader._reportLoadFailure(extPath, err);
      return false;
    }
  }

  async loadEverywhere(extPath, id, { except = null } = {}) {
    for (const sess of this.liveSessions()) {
      if (sess !== except) await this.loadInto(sess, extPath, id);
    }
  }

  unloadEverywhere(id) {
    for (const sess of this.liveSessions()) {
      try { sess.removeExtension(id); } catch (_) {}
      this._loadedFor(sess).delete(id);
    }
  }

  liveSessions() {
    const sessions = new Set(this._sessions);
    for (const wc of webContents.getAllWebContents()) {
      if (wc.session) sessions.add(wc.session);
    }
    sessions.add(session.defaultSession);
    return sessions;
  }

  _loadedFor(sess) {
    if (!this._loadedIds.has(sess)) this._loadedIds.set(sess, new Set());
    return this._loadedIds.get(sess);
  }

  static _reportLoadFailure(extPath, err) {
    const message = (err && err.message) || '';
    if (!ExtensionSessionLoader.QUIET_FAILURE.test(message)) {
      console.warn('[chrome-ext] load failed for', extPath, '->', message);
    }
  }
}

module.exports = ExtensionSessionLoader;
