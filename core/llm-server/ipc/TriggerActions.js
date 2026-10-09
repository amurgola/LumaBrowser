const PathPicker = require('../../shared/ipc/PathPicker');
const TriggerDetails = require('./TriggerDetails');

class TriggerActions {
  static UNAVAILABLE = 'triggers unavailable';
  static NOT_FOUND = 'trigger not found';
  static NOT_A_FILE_TRIGGER = 'not a file trigger';
  static EMITTER = 'emitTriggersEvent';

  constructor({ deps, runConversations, details = null, pickPath = PathPicker.pick }) {
    this._deps = deps;
    this._store = deps.get('triggerStore');
    this._runner = deps.get('triggerRunner');
    this._secrets = deps.get('triggerSecrets');
    this._watches = deps.get('fileWatchManager');
    this._notifications = deps.get('notificationSource');
    this._runs = runConversations;
    this._details = details || new TriggerDetails({ deps });
    this._pickPath = pickPath;
  }

  list() {
    return { triggers: this._store ? this._store.listWithRunCounts() : [] };
  }

  get(id) {
    return this._details.get(id);
  }

  update(id, patch) {
    const trigger = this._requireStore().update(id, patch || {});
    if (trigger) this._changed({ triggerId: id });
    return { success: !!trigger, trigger };
  }

  delete(id) {
    const trigger = this._requireStore().get(id);
    if (!trigger) throw new Error(TriggerActions.NOT_FOUND);
    this.deleteTrigger(trigger);
    this._changed({ triggerId: id });
    return {};
  }

  clearMemory(triggerId) {
    const trigger = this._requireStore().clearMemory(triggerId);
    if (trigger) this._changed({ triggerId });
    return { success: !!trigger, trigger };
  }

  persistedTabs() {
    const source = this._notifications;
    return { tabs: source && typeof source.listTabs === 'function' ? source.listTabs() : [] };
  }

  versions(triggerId) {
    return { versions: this._store ? this._store.listVersions(triggerId) : [] };
  }

  rollback(triggerId, n) {
    return this._emitOnSuccess(this._requireStore().rollbackTo(triggerId, n), triggerId);
  }

  setSecret(id, value) {
    if (!this._secrets || !this._store) throw new Error(TriggerActions.UNAVAILABLE);
    if (!this._store.get(id)) throw new Error(TriggerActions.NOT_FOUND);
    const result = this._secrets.set(id, value);
    this._changed({ triggerId: id });
    return { ...result };
  }

  async pickFile(event, id) {
    const trigger = this._store ? this._store.get(id) : null;
    if (!trigger || trigger.kind !== 'file') throw new Error(TriggerActions.NOT_A_FILE_TRIGGER);
    const picked = await this._pickPath(event, { title: 'Choose a file in the watched folder', defaultPath: trigger.source.dir, properties: ['openFile'] });
    if (picked.canceled) return { canceled: true };
    return { canceled: false, path: picked.paths[0] };
  }

  runs(triggerId, opts) {
    return { runs: this._store ? this._store.listRuns(triggerId, opts || {}) : [] };
  }

  deliveries(triggerId, opts) {
    if (!this._store) return { deliveries: [], counts: {} };
    return { deliveries: this._store.listDeliveries(triggerId, opts || {}), counts: this._store.deliveryCounts(triggerId) };
  }

  async test(id) {
    return this._requireRunner().runInline(id, { kind: 'test' });
  }

  adoptLatestEvent(id) {
    return this._emitOnSuccess(this._requireStore().adoptLatestEvent(id), id);
  }

  approve(runId, decision) {
    return this._requireRunner().approve(runId, decision);
  }

  async simulate(id, body) {
    return this._requireRunner().simulate(id, body);
  }

  async replay(runId) {
    return this._requireRunner().replay(runId);
  }

  deleteTrigger(trigger) {
    this._runs.purge(this._store.runConversationIds(trigger.id));
    try { if (this._watches) this._watches.forget(trigger.id); } catch (_) {}
    try { if (this._secrets) this._secrets.delete(trigger.id); } catch (_) {}
    this._store.delete(trigger.id);
  }

  deleteOwnedBy(conversationId) {
    try {
      if (!this._store) return;
      const owned = this._store.listByConversation(conversationId);
      for (const trigger of owned) this.deleteTrigger(trigger);
      if (owned.length) this._changed({});
    } catch (_) {}
  }

  _emitOnSuccess(result, triggerId) {
    if (result.success) this._changed({ triggerId });
    return result;
  }

  _requireStore() {
    if (!this._store) throw new Error(TriggerActions.UNAVAILABLE);
    return this._store;
  }

  _requireRunner() {
    if (!this._runner) throw new Error(TriggerActions.UNAVAILABLE);
    return this._runner;
  }

  _changed(payload) {
    this._deps.emit(TriggerActions.EMITTER, 'triggers-changed', payload);
  }
}

module.exports = TriggerActions;
