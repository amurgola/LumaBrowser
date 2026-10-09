const { EventEmitter } = require('events');
const StoreHandle = require('../../database/StoreHandle');
const JsonColumn = require('../../database/JsonColumn');
const ArtifactDataQuota = require('./artifacts/ArtifactDataQuota');

class ArtifactDataStore extends EventEmitter {
  static QUOTAS = {
    MAX_KEYS: ArtifactDataQuota.MAX_KEYS,
    MAX_KEY_LEN: ArtifactDataQuota.MAX_KEY_LEN,
    MAX_VALUE_BYTES: ArtifactDataQuota.MAX_VALUE_BYTES,
    MAX_TOTAL_BYTES: ArtifactDataQuota.MAX_TOTAL_BYTES,
  };

  constructor({ settingsDb } = {}) {
    super();
    this._db = StoreHandle.requireOpen(settingsDb, 'ArtifactDataStore');
    this._prepareStatements();
  }

  resolveRootId(idOrRootId) {
    const id = String(idOrRootId || '').trim();
    if (!id) return null;
    const byId = this._resolveRoot.get(id);
    if (byId && byId.rid) return byId.rid;
    return this._rootExists.get(id) ? id : null;
  }

  all(idOrRootId) {
    const rootId = this.resolveRootId(idOrRootId);
    if (!rootId) return ArtifactDataStore._unknown(idOrRootId);
    const row = this._getData.get(rootId);
    return { success: true, rootId, data: ArtifactDataStore._parseData(row), rev: row ? row.rev : 0, updatedAt: row ? row.updated_at : null };
  }

  get(idOrRootId, key) {
    const snapshot = this.all(idOrRootId);
    if (!snapshot.success) return snapshot;
    return { success: true, rootId: snapshot.rootId, rev: snapshot.rev, value: snapshot.data[String(key)] };
  }

  mutate(idOrRootId, ops = {}) {
    const rootId = this.resolveRootId(idOrRootId);
    if (!rootId) return ArtifactDataStore._unknown(idOrRootId);
    const plan = ArtifactDataStore._planMutation(ops || {});
    if (plan.error) return { success: false, error: plan.error };
    const outcome = this._apply(rootId, plan);
    if (outcome.error) return { success: false, error: outcome.error };
    const payload = { rootId, rev: outcome.rev, keys: plan.touched, data: outcome.data };
    this.emit('change', payload);
    return { success: true, ...payload };
  }

  set(idOrRootId, key, value) {
    return this.mutate(idOrRootId, { set: { [String(key)]: value } });
  }

  remove(idOrRootId, key) {
    return this.mutate(idOrRootId, { remove: [String(key)] });
  }

  deleteForRoot(idOrRootId) {
    const rootId = this.resolveRootId(idOrRootId) || String(idOrRootId || '').trim();
    if (!rootId) return false;
    const removed = this._deleteData.run(rootId).changes > 0;
    if (removed) this.emit('change', { rootId, rev: 0, keys: [], data: {} });
    return removed;
  }

  static _planMutation(ops) {
    const plan = { setObj: {}, removeKeys: [], touched: [] };
    const setError = ArtifactDataStore._planSets(ops.set, plan);
    if (setError) return { error: setError };
    const removeError = ArtifactDataStore._planRemoves(ops.remove, plan);
    if (removeError) return { error: removeError };
    if (!plan.touched.length) return { error: 'mutate needs at least one key in "set" or "remove"' };
    return plan;
  }

  static _planSets(set, plan) {
    if (set == null) return null;
    if (typeof set !== 'object' || Array.isArray(set)) return '"set" must be an object of { key: value }';
    for (const [key, value] of Object.entries(set)) {
      const problem = ArtifactDataQuota.checkEntry(key, value);
      if (problem) return problem;
      plan.setObj[key] = value;
      plan.touched.push(key);
    }
    return null;
  }

  static _planRemoves(remove, plan) {
    if (remove == null) return null;
    if (!Array.isArray(remove)) return '"remove" must be an array of key names';
    for (const key of remove.map(String)) {
      plan.removeKeys.push(key);
      plan.touched.push(key);
    }
    return null;
  }

  _apply(rootId, plan) {
    try {
      return this._mutateTx(rootId, plan.setObj, plan.removeKeys);
    } catch (err) {
      if (err && err.isQuota) return { error: err.message };
      return { error: `artifact data write failed: ${err.message}` };
    }
  }

  _writeMerged(rootId, setObj, removeKeys) {
    const row = this._getData.get(rootId);
    const data = ArtifactDataStore._parseData(row);
    for (const key of removeKeys) delete data[key];
    Object.assign(data, setObj);
    const serialized = JSON.stringify(data);
    const quotaProblem = ArtifactDataQuota.checkObject(data, serialized);
    if (quotaProblem) throw Object.assign(new Error(quotaProblem), { isQuota: true });
    const rev = (row ? row.rev : 0) + 1;
    this._upsertData.run({ root_id: rootId, data: serialized, rev, updated_at: new Date().toISOString() });
    return { data, rev };
  }

  static _parseData(row) {
    if (!row) return {};
    return JsonColumn.parse(row.data, {}) || {};
  }

  static _unknown(idOrRootId) {
    return { success: false, error: `unknown artifact "${idOrRootId}"` };
  }

  _prepareStatements() {
    this._getData = this._db.prepare('SELECT data, rev, updated_at FROM llm_artifact_data WHERE root_id = ?');
    this._upsertData = this._db.prepare(`
      INSERT INTO llm_artifact_data (root_id, data, rev, updated_at)
      VALUES (@root_id, @data, @rev, @updated_at)
      ON CONFLICT(root_id) DO UPDATE SET data = @data, rev = @rev, updated_at = @updated_at
    `);
    this._deleteData = this._db.prepare('DELETE FROM llm_artifact_data WHERE root_id = ?');
    this._resolveRoot = this._db.prepare('SELECT COALESCE(root_id, id) AS rid FROM llm_artifacts WHERE id = ?');
    this._rootExists = this._db.prepare('SELECT 1 AS ok FROM llm_artifacts WHERE COALESCE(root_id, id) = ? LIMIT 1');
    this._mutateTx = this._db.transaction((rootId, setObj, removeKeys) => this._writeMerged(rootId, setObj, removeKeys));
  }
}

module.exports = ArtifactDataStore;
