const { session, webContents } = require('electron');
const WorkerRegistrations = require('./shim/WorkerRegistrations');
const CrashTracer = require('../diagnostics/CrashTracer');

class ExtensionSessionLoader {
  static LOAD_OPTIONS = { allowFileAccess: true };
  static QUIET_FAILURE = /already loaded|ENOENT/i;

  constructor({ onTrack = null, registrations = new WorkerRegistrations() } = {}) {
    this._registrations = registrations;
    this._sessions = new Set();
    this._loadedIds = new WeakMap();
    this._pending = new WeakMap();
    this._onTrack = onTrack;
  }

  track(sess) {
    const isNew = !this._sessions.has(sess);
    this._sessions.add(sess);
    this._loadedFor(sess);
    if (isNew && this._onTrack) this._onTrack(sess);
  }

  async loadIntoDefault(extPath) {
    const defaultSession = session.defaultSession;
    const loaded = await defaultSession.loadExtension(extPath, ExtensionSessionLoader.LOAD_OPTIONS);
    this.track(defaultSession);
    this._loadedFor(defaultSession).add(loaded.id);
    this._registrations.record(defaultSession, loaded.id);
    return loaded;
  }

  loadInto(sess, extPath, expectedId) {
    if (expectedId && this._loadedFor(sess).has(expectedId)) return Promise.resolve(false);
    const pending = this._pendingFor(sess);
    if (pending.has(extPath)) return pending.get(extPath);
    const load = this._load(sess, extPath, expectedId).finally(() => pending.delete(extPath));
    pending.set(extPath, load);
    return load;
  }

  isLoading(sess) {
    const pending = this._pending.get(sess);
    return !!pending && pending.size > 0;
  }

  async settled(sess) {
    const pending = this._pending.get(sess);
    while (pending && pending.size > 0) await Promise.all([...pending.values()]);
  }

  async _load(sess, extPath, expectedId) {
    const where = ExtensionSessionLoader.sessionLabel(sess);
    CrashTracer.mark('ext:load', { session: where, id: expectedId || null });
    try {
      await this._registrations.prepare(sess, expectedId);
      const loaded = await sess.loadExtension(extPath, ExtensionSessionLoader.LOAD_OPTIONS);
      this._loadedFor(sess).add(loaded.id);
      this._registrations.record(sess, loaded.id);
      CrashTracer.mark('ext:loaded', { session: where, id: loaded.id });
      return true;
    } catch (err) {
      CrashTracer.mark('ext:load-failed', { session: where, id: expectedId || null });
      ExtensionSessionLoader._reportLoadFailure(extPath, err);
      return false;
    }
  }

  static sessionLabel(sess) {
    const dir = sess && typeof sess.storagePath === 'string' ? sess.storagePath.replace(/[\\/]+$/, '') : '';
    if (!dir) return '?';
    const parts = dir.split(/[\\/]/);
    return parts[parts.length - 2] === 'Partitions' ? parts[parts.length - 1] : 'default';
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

  _pendingFor(sess) {
    if (!this._pending.has(sess)) this._pending.set(sess, new Map());
    return this._pending.get(sess);
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
