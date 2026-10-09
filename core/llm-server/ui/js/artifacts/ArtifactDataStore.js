import ArtifactDataCache from './ArtifactDataCache.js';
import ArtifactDataTransport from './ArtifactDataTransport.js';
import HttpDataTransport from './HttpDataTransport.js';
import IpcDataTransport from './IpcDataTransport.js';

export default class ArtifactDataStore {
  static MODULE_METHODS = ['get', 'all', 'set', 'remove', 'onChange', 'dispose'];

  static create(opts) {
    return new ArtifactDataStore(opts.rootId, ArtifactDataStore._transportFor(opts.transport));
  }

  constructor(rootId, transport) {
    this._transport = transport;
    this._rootId = String(rootId || '');
    this._rev = -1;
    this._data = {};
    this._disposed = false;
    this._listeners = new Set();
    this._unsubscribe = null;
    this._pollTimer = null;
    this._hydratePromise = null;
    this._bindModuleMethods();
    this._loadCache();
    this._hydrate();
  }

  async get(key) {
    if (this._rev < 0) await this._hydrate();
    return this._data[String(key)];
  }

  async all() {
    if (this._rev < 0) await this._hydrate();
    return ArtifactDataStore._copy(this._data);
  }

  async set(key, value) {
    return this._mutate({ set: { [String(key)]: value } }, [String(key)]);
  }

  async remove(key) {
    return this._mutate({ remove: [String(key)] }, [String(key)]);
  }

  onChange(cb) {
    if (typeof cb !== 'function') return () => {};
    this._listeners.add(cb);
    this._ensureSubscribed();
    return () => {
      this._listeners.delete(cb);
      if (!this._listeners.size) this._teardownSubscription();
    };
  }

  get readOnly() {
    return !!this._transport.readOnly;
  }

  dispose() {
    this._disposed = true;
    this._listeners.clear();
    this._teardownSubscription();
  }

  _bindModuleMethods() {
    for (const name of ArtifactDataStore.MODULE_METHODS) this[name] = this[name].bind(this);
  }

  _loadCache() {
    const cached = ArtifactDataCache.read(this._rootId);
    if (cached) { this._rev = cached.rev; this._data = cached.data; }
  }

  _hydrate() {
    if (!this._hydratePromise) {
      this._hydratePromise = Promise.resolve(this._transport.all(this._rootId, this._rev >= 0 ? this._rev : null))
        .then((snap) => { this._adopt(snap); return snap; })
        .catch(() => null)
        .finally(() => { this._hydratePromise = null; });
    }
    return this._hydratePromise;
  }

  _adopt(snap, changedKeys) {
    if (this._disposed || !snap || snap.success === false || snap.unchanged) return;
    if (typeof snap.rev !== 'number' || snap.rev <= this._rev) return;
    if (snap.rootId && snap.rootId !== this._rootId) this._rootId = snap.rootId;
    this._rev = snap.rev;
    this._data = (snap.data && typeof snap.data === 'object') ? snap.data : {};
    ArtifactDataCache.write(this._rootId, this._rev, this._data);
    this._notify(changedKeys);
  }

  _notify(changedKeys) {
    if (!this._listeners.size) return;
    const payload = { keys: changedKeys || Object.keys(this._data), data: ArtifactDataStore._copy(this._data), rev: this._rev };
    for (const cb of this._listeners) { try { cb(payload); } catch (_) {} }
  }

  _onDirty(newRev) {
    if (this._disposed) return;
    if (typeof newRev === 'number' && newRev <= this._rev) return;
    this._hydrate();
  }

  _ensureSubscribed() {
    if (this._disposed || !this._listeners.size) return;
    if (this._transport.canPush) {
      if (!this._unsubscribe) this._unsubscribe = this._transport.subscribe(this._rootId, (rev) => this._onDirty(rev));
    } else if (!this._pollTimer) {
      this._pollTimer = setInterval(() => { this._hydrate(); }, this._transport.pollMs || ArtifactDataTransport.DEFAULT_POLL_MS);
    }
  }

  _teardownSubscription() {
    if (this._unsubscribe) { try { this._unsubscribe(); } catch (_) {} this._unsubscribe = null; }
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  async _mutate(ops, touchedKeys) {
    if (this._transport.readOnly) throw new Error('this view is read-only');
    const before = { rev: this._rev, data: ArtifactDataStore._copy(this._data) };
    this._applyLocally(ops);
    const result = await Promise.resolve(this._transport.mutate(this._rootId, ops)).catch((err) => ({
      success: false, error: (err && err.message) || String(err),
    }));
    if (!result || result.success === false) this._rollBack(before, result);
    this._adopt(result, touchedKeys);
    return true;
  }

  _applyLocally(ops) {
    if (ops.set) for (const k of Object.keys(ops.set)) this._data[k] = ops.set[k];
    if (ops.remove) for (const k of ops.remove) delete this._data[k];
    ArtifactDataCache.write(this._rootId, this._rev, this._data);
  }

  _rollBack(before, result) {
    this._rev = before.rev;
    this._data = before.data;
    ArtifactDataCache.write(this._rootId, this._rev, this._data);
    throw new Error((result && result.error) || 'artifact data write failed');
  }

  static _transportFor(spec) {
    return (spec && spec.kind === 'http') ? new HttpDataTransport(spec) : new IpcDataTransport(spec.api);
  }

  static _copy(obj) {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = obj[k];
    return out;
  }
}
