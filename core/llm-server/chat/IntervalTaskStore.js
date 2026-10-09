const StoreHandle = require('../../database/StoreHandle');
const RecordId = require('../../database/RecordId');

class IntervalTaskStore {
  static TASK_TABLE = null;
  static RUN_TABLE = null;
  static TASK_ID_PREFIX = null;
  static RUN_ID_PREFIX = null;
  static MIN_INTERVAL_MS = 5 * 60 * 1000;
  static MAX_INTERVAL_MS = null;
  static DEFAULT_INTERVAL_MS = null;
  static DEFAULT_TITLE = null;
  static DEFAULT_RUN_LIMIT = 20;
  static MAX_RUN_LIMIT = 200;
  static DEFAULT_KEEP_TRANSCRIPTS = 20;
  static OWNER = null;
  static MISSING_PROMPT = null;
  static OUTCOME = null;
  static TASK_EXTRAS = [];
  static RUN_EXTRAS = [];

  static REQUIRED_DECLARATIONS = ['TASK_TABLE', 'RUN_TABLE', 'TASK_ID_PREFIX', 'RUN_ID_PREFIX', 'MAX_INTERVAL_MS',
    'DEFAULT_INTERVAL_MS', 'DEFAULT_TITLE', 'OWNER', 'MISSING_PROMPT', 'OUTCOME'];

  constructor({ settingsDb } = {}) {
    this._assertDeclared();
    this._db = StoreHandle.requireOpen(settingsDb, this.constructor.name);
    this._prepareSharedStatements();
  }

  static newTaskId() {
    return RecordId.create(this.TASK_ID_PREFIX);
  }

  static newRunId() {
    return RecordId.create(this.RUN_ID_PREFIX);
  }

  static clampInterval(ms) {
    const n = parseInt(ms, 10);
    if (!Number.isFinite(n)) return this.DEFAULT_INTERVAL_MS;
    return Math.min(this.MAX_INTERVAL_MS, Math.max(this.MIN_INTERVAL_MS, n));
  }

  create(input = {}) {
    this._assertCreatable(input);
    const row = this._newTaskRow(input, new Date());
    this._insertTask.run(row);
    return this.get(row.id);
  }

  get(id) {
    const row = this._getTask.get(id);
    return row ? this._hydrateTask(row) : null;
  }

  list() {
    return this._listTasks.all().map((r) => this._hydrateTask(r));
  }

  due(nowIso) {
    return this._dueTasks.all(nowIso || new Date().toISOString()).map((r) => this._hydrateTask(r));
  }

  update(id, patch = {}) {
    const current = this._getTask.get(id);
    if (!current) return null;
    const now = new Date();
    const fields = this._patchedFields(current, patch);
    const nextRunAt = this._nextRunAfterPatch(current, fields, patch, now);
    this._updateTask.run({ ...fields, next_run_at: nextRunAt, updated_at: now.toISOString(), id });
    return this.get(id);
  }

  markDueNow(id) {
    const now = new Date().toISOString();
    return this._markDueNow.run(now, now, id).changes > 0;
  }

  recordCompletion(id, { status } = {}) {
    const current = this._getTask.get(id);
    if (!current) return;
    const now = new Date();
    const next = current.enabled ? IntervalTaskStore._after(now, current.interval_ms) : null;
    this._recordCompletion.run(now.toISOString(), next, status || null, now.toISOString(), id);
  }

  delete(id) {
    this._deleteRunsForTask.run(id);
    return this._deleteTask.run(id).changes > 0;
  }

  recordRunStart(taskId, options = {}) {
    const row = {
      id: this.constructor.newRunId(),
      task_id: taskId,
      conversation_id: options.conversationId || null,
      status: 'running',
      started_at: new Date().toISOString(),
      ...this._extraValues(this.constructor.RUN_EXTRAS, options),
    };
    this._insertRun.run(row);
    return this.getRun(row.id);
  }

  recordRunFinish(runId, options = {}) {
    const outcome = options[this.constructor.OUTCOME.field];
    const capped = outcome ? String(outcome).slice(0, this.constructor.OUTCOME.maxChars) : null;
    this._finishRun.run(options.status || 'ok', new Date().toISOString(), options.error || null, capped, runId);
    return this.getRun(runId);
  }

  getRun(id) {
    const row = this._getRun.get(id);
    return row ? this._hydrateRun(row) : null;
  }

  listRuns(taskId, { limit = this.constructor.DEFAULT_RUN_LIMIT, offset = 0 } = {}) {
    return this._listRuns.all(taskId, Math.min(limit, this.constructor.MAX_RUN_LIMIT), offset).map((r) => this._hydrateRun(r));
  }

  pruneTranscripts(taskId, keep = this.constructor.DEFAULT_KEEP_TRANSCRIPTS) {
    const conversationIds = [];
    for (const run of this._runsWithTranscriptBeyond.all(taskId, Math.max(0, keep))) {
      this._clearRunConversation.run(run.id);
      if (run.conversation_id) conversationIds.push(run.conversation_id);
    }
    return conversationIds;
  }

  _assertDeclared() {
    const missing = IntervalTaskStore.REQUIRED_DECLARATIONS.filter((key) => this.constructor[key] == null);
    if (missing.length) throw new Error(`${this.constructor.name} must declare ${missing.join(', ')}`);
  }

  _assertCreatable(input) {
    const { OWNER, MISSING_PROMPT } = this.constructor;
    if (!IntervalTaskStore._hasText(input[OWNER.field])) throw new Error(OWNER.missing);
    if (!IntervalTaskStore._hasText(input.prompt)) throw new Error(MISSING_PROMPT);
  }

  _newTaskRow(input, now) {
    const Store = this.constructor;
    const enabled = input.enabled !== undefined ? !!input.enabled : true;
    const interval = Store.clampInterval(input.intervalMs);
    return {
      id: Store.newTaskId(),
      [Store.OWNER.column]: String(input[Store.OWNER.field]),
      title: (input.title && String(input.title).trim()) || Store.DEFAULT_TITLE,
      prompt: String(input.prompt),
      interval_ms: interval,
      enabled: enabled ? 1 : 0,
      last_run_at: null,
      next_run_at: enabled ? IntervalTaskStore._after(now, interval) : null,
      last_status: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      ...this._extraValues(Store.TASK_EXTRAS, input),
    };
  }

  _patchedFields(current, patch) {
    const Store = this.constructor;
    const fields = {
      title: patch.title != null ? (String(patch.title).trim() || current.title) : current.title,
      prompt: patch.prompt != null ? (String(patch.prompt) || current.prompt) : current.prompt,
      interval_ms: patch.intervalMs != null ? Store.clampInterval(patch.intervalMs) : current.interval_ms,
      enabled: patch.enabled !== undefined ? (patch.enabled ? 1 : 0) : current.enabled,
    };
    for (const extra of Store.TASK_EXTRAS) {
      fields[extra.column] = patch[extra.field] !== undefined ? (patch[extra.field] || extra.fallback) : current[extra.column];
    }
    return fields;
  }

  _nextRunAfterPatch(current, fields, patch, now) {
    if (!fields.enabled) return null;
    const intervalChanged = patch.intervalMs != null && fields.interval_ms !== current.interval_ms;
    if (!current.enabled || intervalChanged) return IntervalTaskStore._after(now, fields.interval_ms);
    return current.next_run_at;
  }

  _extraValues(extras, input) {
    return Object.fromEntries(extras.map((e) => [e.column, input[e.field] || e.fallback]));
  }

  _hydrateTask(r) {
    const { OWNER, TASK_EXTRAS } = this.constructor;
    return {
      id: r.id,
      [OWNER.field]: r[OWNER.column],
      title: r.title,
      prompt: r.prompt,
      intervalMs: r.interval_ms,
      ...this._hydrateExtras(TASK_EXTRAS, r),
      enabled: !!r.enabled,
      lastRunAt: r.last_run_at,
      nextRunAt: r.next_run_at,
      lastStatus: r.last_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  _hydrateRun(r) {
    const { OUTCOME, RUN_EXTRAS } = this.constructor;
    return {
      id: r.id,
      taskId: r.task_id,
      conversationId: r.conversation_id,
      ...this._hydrateExtras(RUN_EXTRAS, r),
      status: r.status,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      error: r.error,
      [OUTCOME.field]: r[OUTCOME.column],
    };
  }

  _hydrateExtras(extras, row) {
    return Object.fromEntries(extras.map((e) => [e.field, row[e.column] || e.fallback]));
  }

  _prepareSharedStatements() {
    const { TASK_TABLE: tasks, RUN_TABLE: runs, OWNER, OUTCOME, TASK_EXTRAS, RUN_EXTRAS } = this.constructor;
    const taskColumns = ['id', OWNER.column, 'title', 'prompt', 'interval_ms', 'enabled', 'last_run_at', 'next_run_at',
      'last_status', 'created_at', 'updated_at', ...TASK_EXTRAS.map((e) => e.column)];
    const runColumns = ['id', 'task_id', 'conversation_id', 'status', 'started_at', ...RUN_EXTRAS.map((e) => e.column)];
    const patchColumns = ['title', 'prompt', 'interval_ms', ...TASK_EXTRAS.map((e) => e.column), 'enabled', 'next_run_at', 'updated_at'];

    this._insertTask = this._db.prepare(IntervalTaskStore._insertSql(tasks, taskColumns));
    this._getTask = this._db.prepare(`SELECT * FROM ${tasks} WHERE id = ?`);
    this._listTasks = this._db.prepare(`SELECT * FROM ${tasks} ORDER BY created_at DESC`);
    this._dueTasks = this._db.prepare(`SELECT * FROM ${tasks} WHERE enabled = 1 AND next_run_at IS NOT NULL AND next_run_at <= ? ORDER BY next_run_at ASC`);
    this._updateTask = this._db.prepare(`UPDATE ${tasks} SET ${patchColumns.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`);
    this._markDueNow = this._db.prepare(`UPDATE ${tasks} SET next_run_at = ?, updated_at = ? WHERE id = ? AND enabled = 1`);
    this._recordCompletion = this._db.prepare(`UPDATE ${tasks} SET last_run_at = ?, next_run_at = ?, last_status = ?, updated_at = ? WHERE id = ?`);
    this._deleteTask = this._db.prepare(`DELETE FROM ${tasks} WHERE id = ?`);

    this._insertRun = this._db.prepare(IntervalTaskStore._insertSql(runs, runColumns));
    this._finishRun = this._db.prepare(`UPDATE ${runs} SET status = ?, completed_at = ?, error = ?, ${OUTCOME.column} = ? WHERE id = ?`);
    this._getRun = this._db.prepare(`SELECT * FROM ${runs} WHERE id = ?`);
    this._listRuns = this._db.prepare(`SELECT * FROM ${runs} WHERE task_id = ? ORDER BY started_at DESC, rowid DESC LIMIT ? OFFSET ?`);
    this._runsWithTranscriptBeyond = this._db.prepare(`
      SELECT id, conversation_id FROM ${runs}
      WHERE task_id = ? AND conversation_id IS NOT NULL
      ORDER BY started_at DESC, rowid DESC
      LIMIT -1 OFFSET ?
    `);
    this._clearRunConversation = this._db.prepare(`UPDATE ${runs} SET conversation_id = NULL WHERE id = ?`);
    this._deleteRunsForTask = this._db.prepare(`DELETE FROM ${runs} WHERE task_id = ?`);
  }

  static _insertSql(table, columns) {
    return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((c) => `@${c}`).join(', ')})`;
  }

  static _after(date, ms) {
    return new Date(date.getTime() + ms).toISOString();
  }

  static _hasText(value) {
    return !!value && !!String(value).trim();
  }
}

module.exports = IntervalTaskStore;
