const StoreHandle = require('../../database/StoreHandle');
const RecordId = require('../../database/RecordId');
const WebhookPresets = require('./triggers/WebhookPresets');
const FileWatch = require('./triggers/file/FileWatch');
const HookToken = require('./trigger-store/HookToken');
const TriggerLifecycle = require('./trigger-store/TriggerLifecycle');
const TriggerSourceConfig = require('./trigger-store/TriggerSourceConfig');
const TriggerActionConfig = require('./trigger-store/TriggerActionConfig');
const TriggerFailurePolicy = require('./trigger-store/TriggerFailurePolicy');
const TriggerApprovalPolicy = require('./trigger-store/TriggerApprovalPolicy');
const TriggerMemoryPolicy = require('./trigger-store/TriggerMemoryPolicy');
const TriggerPatch = require('./trigger-store/TriggerPatch');
const FailureStreak = require('./trigger-store/FailureStreak');
const DriftRecord = require('./trigger-store/DriftRecord');
const CappedJson = require('./trigger-store/CappedJson');
const TriggerRowMapper = require('./trigger-store/TriggerRowMapper');
const TriggerRepository = require('./trigger-store/TriggerRepository');
const TriggerRunRepository = require('./trigger-store/TriggerRunRepository');
const TriggerDeliveryRepository = require('./trigger-store/TriggerDeliveryRepository');
const TriggerVersionRepository = require('./trigger-store/TriggerVersionRepository');
const TriggerRunLog = require('./trigger-store/TriggerRunLog');
const TriggerDeliveryLog = require('./trigger-store/TriggerDeliveryLog');
const TriggerVersionHistory = require('./trigger-store/TriggerVersionHistory');

class TriggerStore {
  static KINDS = TriggerSourceConfig.KINDS;
  static MODES = TriggerActionConfig.MODES;
  static RESPOND = TriggerSourceConfig.RESPOND;
  static FILE_EVENTS = FileWatch.FILE_EVENTS;
  static PRESETS = WebhookPresets.PRESETS;
  static DELIVERY_OUTCOMES = TriggerDeliveryLog.OUTCOMES;
  static APPROVAL_MODES = TriggerApprovalPolicy.MODES;
  static DEFAULT_AUTO_PAUSE_AFTER = TriggerFailurePolicy.DEFAULT_AUTO_PAUSE_AFTER;
  static DEFAULT_RETRY_MAX = TriggerFailurePolicy.DEFAULT_RETRY_MAX;
  static DEFAULT_RETRY_BACKOFF_MS = TriggerFailurePolicy.DEFAULT_RETRY_BACKOFF_MS;
  static DEFAULT_MEMORY_RUNS = TriggerMemoryPolicy.DEFAULT_RUNS;
  static DEFAULT_MEMORY_CHARS = TriggerMemoryPolicy.DEFAULT_CHARS;
  static KEEP_DELIVERIES = TriggerDeliveryLog.KEEP;
  static KEEP_VERSIONS = TriggerVersionHistory.KEEP;
  static MAX_EVENT_CHARS = TriggerRunLog.MAX_EVENT_CHARS;
  static HOOK_TOKEN_RE = HookToken.PATTERN;
  static DEFAULT_KEEP_TRANSCRIPTS = 20;

  constructor({ settingsDb } = {}) {
    const db = StoreHandle.requireOpen(settingsDb, 'TriggerStore');
    this._triggers = new TriggerRepository(db);
    this._runs = new TriggerRunLog(new TriggerRunRepository(db));
    this._deliveries = new TriggerDeliveryLog(new TriggerDeliveryRepository(db));
    this._versions = new TriggerVersionHistory(new TriggerVersionRepository(db));
  }

  static newTriggerId() { return RecordId.create('trig'); }
  static newRunId() { return TriggerRunLog.newId(); }
  static newHookToken() { return HookToken.create(); }
  static configHash(trigger) { return TriggerLifecycle.configHash(trigger); }
  static isArmable(trigger) { return TriggerLifecycle.isArmable(trigger); }
  static statusOf(trigger) { return TriggerLifecycle.statusOf(trigger); }
  static normalizeSource(kind, source) { return TriggerSourceConfig.normalize(kind, source); }
  static normalizeAction(action) { return TriggerActionConfig.normalize(action); }
  static normalizeMemory(memory) { return TriggerMemoryPolicy.normalize(memory); }
  static memoryPolicy(trigger) { return TriggerMemoryPolicy.of(trigger); }
  static approvalPolicy(trigger) { return TriggerApprovalPolicy.of(trigger); }
  static failurePolicy(trigger) { return TriggerFailurePolicy.of(trigger); }

  create({ conversationId, title, kind = 'webhook', source, action } = {}) {
    TriggerStore._assertCreatable(conversationId, kind);
    const row = TriggerStore._newRow({ conversationId, title, kind, source, action });
    this._triggers.insert(row);
    const created = this.get(row.id);
    this._versions.record(created, 'create');
    return created;
  }

  get(id) {
    return this._hydrate(this._triggers.get(id));
  }

  getByToken(token) {
    if (!HookToken.isWellFormed(token)) return null;
    return this._hydrate(this._triggers.getByToken(String(token)));
  }

  list() {
    return this._triggers.list().map(TriggerRowMapper.trigger);
  }

  listWithRunCounts() {
    return this._triggers.listWithRunCounts().map((r) => ({ ...TriggerRowMapper.trigger(r), runCount: r.run_count || 0 }));
  }

  listByConversation(conversationId) {
    return this._triggers.listByConversation(String(conversationId || '')).map(TriggerRowMapper.trigger);
  }

  getByConversation(conversationId) {
    return this.listByConversation(conversationId)[0] || null;
  }

  update(id, patch = {}) {
    const current = this.get(id);
    if (!current) return null;
    const { next, enabled, rearmed } = TriggerPatch.apply(current, patch);
    this._writeConfig(id, next, enabled, rearmed);
    const after = this.get(id);
    this._recordActionChange(current, after, patch);
    return after;
  }

  listVersions(triggerId) {
    return this._versions.list(triggerId);
  }

  versionInfo(triggerId) {
    return this._versions.info(triggerId);
  }

  rollbackTo(triggerId, n) {
    const current = this.get(triggerId);
    if (!current) return { success: false, error: 'trigger not found' };
    const version = this._versions.find(triggerId, n);
    const refusal = this._rollbackRefusal(current, version, n);
    if (refusal) return { success: false, error: refusal };
    const updated = this.update(triggerId, { action: TriggerRowMapper.version(version).action, origin: 'rollback', note: 'restored v' + version.n });
    const restoredTest = this._restoreVersionTest(updated, version);
    return { success: true, trigger: this.get(triggerId), restored: version.n, restoredTest, version: this.versionInfo(triggerId).current };
  }

  approveTool(id, toolName) {
    const current = this.get(id);
    if (!current) return null;
    const name = String(toolName || '').trim();
    if (!name) return current;
    return this.update(id, { source: { approvedTools: TriggerApprovalPolicy.withTool(current, name) } });
  }

  setSample(id, sample) {
    if (!this._triggers.get(id)) return null;
    const json = sample == null ? null : CappedJson.stringify(sample, TriggerRunLog.MAX_EVENT_CHARS);
    this._triggers.setSample(id, json, new Date().toISOString());
    return this.get(id);
  }

  recordDrift(id, drift, { runId = null } = {}) {
    const current = this.get(id);
    if (!current) return { isNew: false, drift: null };
    const result = DriftRecord.next(current.lastDrift, drift, runId);
    this._triggers.setDrift(id, JSON.stringify(result.drift), result.drift.at);
    return result;
  }

  clearDrift(id) {
    this._triggers.setDrift(id, null, new Date().toISOString());
    return this.get(id);
  }

  adoptLatestEvent(id) {
    const latest = this._runs.latestRealEvent(id);
    if (!latest) return { success: false, error: 'no real event has run yet' };
    this.setSample(id, latest.event);
    return { success: true, trigger: this.get(id), fromRunId: latest.runId };
  }

  setMemory(id, text) {
    const current = this.get(id);
    if (!current) return null;
    const notes = TriggerMemoryPolicy.capNotes(current, text);
    const at = new Date().toISOString();
    this._triggers.setMemory(id, notes || null, notes ? at : null, at);
    return this.get(id);
  }

  clearMemory(id) {
    return this.setMemory(id, '');
  }

  recordTest(id, { ok, runId, error } = {}) {
    const current = this.get(id);
    if (!current) return null;
    const lastTest = { ok: !!ok, configHash: TriggerLifecycle.configHash(current), at: new Date().toISOString(), runId: runId || null, error: error || null };
    this._triggers.setLastTest(id, JSON.stringify(lastTest), lastTest.at);
    if (lastTest.ok) this._versions.markTested(id, lastTest.configHash, lastTest.at, lastTest.runId);
    return this.get(id);
  }

  recordFire(id, { status, error } = {}) {
    const current = this.get(id);
    if (!current) return { consecutiveFailures: 0, firstFailure: false, autoPaused: false, pausedReason: null };
    const streak = FailureStreak.after(current, { status, error });
    this._writeFire(id, status, streak);
    const { failed, ...outcome } = streak;
    return outcome;
  }

  runConversationIds(triggerId) {
    return this._runs.conversationIds(triggerId);
  }

  delete(id) {
    this._runs.deleteForTrigger(id);
    this._deliveries.deleteForTrigger(id);
    this._versions.deleteForTrigger(id);
    return this._triggers.delete(id);
  }

  recordDelivery(triggerId, delivery) { return this._deliveries.record(triggerId, delivery); }
  updateDelivery(id, change) { return this._deliveries.update(id, change); }
  getDelivery(id) { return this._deliveries.get(id); }
  listDeliveries(triggerId, page) { return this._deliveries.list(triggerId, page); }
  deliveryCounts(triggerId) { return this._deliveries.counts(triggerId); }

  hasRunForDedupeKey(triggerId, key) { return this._runs.hasDedupeKey(triggerId, key); }
  recordRunStart(triggerId, run) { return this._runs.start(triggerId, run); }
  recordRunFinish(runId, outcome) { return this._runs.finish(runId, outcome); }
  getRun(id) { return this._runs.get(id); }
  listRuns(triggerId, page) { return this._runs.list(triggerId, page); }

  pruneTranscripts(triggerId, keep = TriggerStore.DEFAULT_KEEP_TRANSCRIPTS) {
    return this._runs.pruneTranscripts(triggerId, keep);
  }

  static _assertCreatable(conversationId, kind) {
    if (!conversationId || !String(conversationId).trim()) throw new Error('a trigger needs the setup conversationId');
    if (!TriggerSourceConfig.KINDS.includes(kind)) throw new Error(`unsupported trigger kind: ${kind}`);
  }

  static _newRow({ conversationId, title, kind, source, action }) {
    const now = new Date().toISOString();
    return {
      id: TriggerStore.newTriggerId(),
      conversation_id: String(conversationId),
      title: (title && String(title).trim()) || 'Trigger',
      kind,
      hook_token: kind === 'webhook' ? HookToken.create() : null,
      source: JSON.stringify(TriggerSourceConfig.normalize(kind, source)),
      action: JSON.stringify(TriggerActionConfig.normalize(action)),
      sample: null,
      last_test: null,
      enabled: 0,
      fire_count: 0,
      last_fired_at: null,
      last_status: null,
      created_at: now,
      updated_at: now,
    };
  }

  _hydrate(row) {
    return row ? TriggerRowMapper.trigger(row) : null;
  }

  _writeConfig(id, next, enabled, rearmed) {
    this._triggers.updateConfig({
      id,
      title: next.title,
      source: JSON.stringify(next.source),
      action: JSON.stringify(next.action),
      enabled: enabled ? 1 : 0,
      updated_at: new Date().toISOString(),
      clear_pause: rearmed ? 1 : 0,
    });
  }

  _recordActionChange(before, after, patch) {
    if (JSON.stringify(after.action) === JSON.stringify(before.action)) return;
    this._versions.record(after, TriggerVersionHistory.originOf(patch.origin), patch.note, before.enabled);
  }

  _rollbackRefusal(current, version, n) {
    if (!version) {
      const kept = this.listVersions(current.id).map((v) => 'v' + v.n).join(', ') || 'none';
      return 'no version ' + n + ' (kept: ' + kept + ')';
    }
    if (version.action === JSON.stringify(current.action)) return 'v' + version.n + ' is already the live instruction';
    return null;
  }

  _restoreVersionTest(updated, version) {
    if (!version.tested || TriggerLifecycle.configHash(updated) !== version.config_hash) return false;
    const lastTest = {
      ok: true, configHash: version.config_hash, at: version.test_at || new Date().toISOString(),
      runId: version.test_run_id || null, error: null, restoredFrom: version.n,
    };
    const rearm = !!version.was_armed;
    this._triggers.restoreTest({
      id: updated.id, last_test: JSON.stringify(lastTest), enabled: rearm ? 1 : 0, updated_at: new Date().toISOString(), clear_pause: rearm ? 1 : 0,
    });
    this._versions.markTested(updated.id, version.config_hash, lastTest.at, lastTest.runId);
    return true;
  }

  _writeFire(id, status, streak) {
    this._triggers.recordFire({
      id,
      at: new Date().toISOString(),
      status: status || null,
      streak: streak.consecutiveFailures,
      auto_paused: streak.autoPaused ? 1 : 0,
      paused_reason: streak.pausedReason,
      succeeded: streak.failed ? 0 : 1,
    });
  }
}

module.exports = TriggerStore;
