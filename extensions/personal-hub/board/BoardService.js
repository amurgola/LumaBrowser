const RecordId = require('../../../core/database/RecordId');
const StatusMapping = require('./StatusMapping');
const TrackerLists = require('./TrackerLists');

class BoardService {
  static TASK_ID_PREFIX = 'task';
  static MESSAGE_ID_PREFIX = 'tmsg';
  static SOURCE_ID_PREFIX = 'tsrc';
  static COLUMN_ID_PREFIX = 'col';
  static MIN_INTERVAL_MS = 60 * 1000;
  static MAX_INTERVAL_MS = 6 * 60 * 60 * 1000;
  static DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
  static LIST_CACHE_MS = TrackerLists.CACHE_MS;
  static DEFAULT_KIND = 'clickup';
  static DEFAULT_AUTHOR = 'me';
  static COLUMN_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  static NOT_CONNECTED = 'The source is not connected.';

  constructor({ columns, tasks, messages, sources, secrets, providers = {}, emit = () => {}, fetchImpl = null, now = () => new Date() }) {
    this._columns = columns;
    this._tasks = tasks;
    this._messages = messages;
    this._sources = sources;
    this._secrets = secrets;
    this._providers = providers;
    this._emit = emit;
    this._fetchImpl = fetchImpl;
    this._now = now;
    this._lists = new TrackerLists({ fetchImpl, now });
  }


  listColumns() {
    return this._columns.list();
  }

  saveColumns(columns) {
    const clean = BoardService._cleanColumns(columns);
    const previous = this._columns.list();
    for (const column of clean) this._columns.upsert(column);
    this._dropColumns(previous, clean);
    this._pruneLinks(clean.map((c) => c.key));
    this._emit('board.changed', { reason: 'columns' });
    return this._columns.list();
  }

  linkStatus(status, columnKey) {
    const name = String(status || '').trim();
    if (!name) throw new Error('Name the status to link.');
    if (!columnKey) throw new Error('Name the column to link the status to.');
    const column = this._requireColumn(columnKey);
    const pseudo = StatusMapping.pseudoKey(name);
    const holders = new Set(this._tasks.list({ columnKey: pseudo, includeHidden: true }).map((t) => t.sourceId).filter(Boolean));
    const sources = this._sources.list().filter((s) => !holders.size || holders.has(s.id));
    for (const source of sources) this._link(source, name, column.key);
    this._emit('board.changed', { reason: 'status-linked', status: name, columnKey: column.key });
    return { columnKey: column.key, sources: sources.length };
  }

  addStatusColumn(status) {
    const title = String(status || '').trim();
    if (!title) throw new Error('Name the status to turn into a column.');
    const columns = this._columns.list();
    const key = BoardService._uniqueKey(title, columns);
    const doneIndex = columns.findIndex((c) => c.isDone);
    const next = columns.map((c) => ({ key: c.key, title: c.title, isDone: c.isDone }));
    next.splice(doneIndex >= 0 ? doneIndex : next.length, 0, { key, title, isDone: false });
    this.saveColumns(next);
    this.linkStatus(title, key);
    return this._columns.list().find((c) => c.key === key);
  }

  resetStatusLinks(sourceId) {
    const source = this._sources.get(sourceId);
    if (!source) throw new Error('Task source not found.');
    const updated = this._sources.update(source.id, { config: { ...source.config, statusColumns: {}, statusLabels: {}, statusMap: {} } });
    this._reflow(updated);
    this._emit('board.changed', { reason: 'status-linked', sourceId });
    return this._publicSource(updated);
  }


  listTasks({ columnKey = null, sourceId = null, includeArchived = false, includeHidden = false } = {}) {
    const sources = new Map(this._sources.list().map((s) => [s.id, s]));
    return this._tasks.list({ columnKey, sourceId, includeArchived, includeHidden }).map((task) => BoardService._withSource(task, sources.get(task.sourceId)));
  }

  getTask(id) {
    const task = this._tasks.get(id);
    if (!task) return null;
    const source = task.sourceId ? this._sources.get(task.sourceId) : null;
    return { task: BoardService._withSource(task, source), messages: this._messages.listForTask(id), source: source ? this._publicSource(source) : null };
  }

  async createTask({ title, description = '', columnKey = null, priority = '', dueAt = null, tags = [], sourceId = null, listId = null, status = null } = {}) {
    const name = String(title || '').trim();
    if (!name) throw new Error('A task needs a title.');
    const column = this._requireColumn(columnKey);
    if (sourceId) return this._createRemoteTask(sourceId, column, { title: name, description: String(description || ''), listId, status });
    const task = this._tasks.insert({
      id: RecordId.create(BoardService.TASK_ID_PREFIX),
      title: name,
      description: String(description || ''),
      columnKey: column.key,
      priority: String(priority || ''),
      dueAt: dueAt || null,
      tags: Array.isArray(tags) ? tags.map(String) : [],
    });
    this._emit('task.changed', { taskId: task.id, reason: 'created' });
    return task;
  }

  async updateTask(id, patch = {}) {
    const current = this._requireTask(id);
    const columns = BoardService._taskPatchColumns(patch);
    const task = Object.keys(columns).length ? this._tasks.update(id, columns) : current;
    const reply = { task };
    if (task.sourceId && (patch.title !== undefined || patch.description !== undefined)) {
      const pushError = await this._pushFields(task, patch);
      if (pushError) reply.pushError = pushError;
      reply.task = this._tasks.get(id);
    }
    this._emit('task.changed', { taskId: id, reason: 'updated' });
    return reply;
  }

  async moveTask(id, columnKey, { sortOrder = null, status = null } = {}) {
    const current = this._requireTask(id);
    if (StatusMapping.isPseudo(columnKey)) throw new Error('Tasks cannot be moved into an unlinked status column.');
    if (!columnKey) throw new Error('Name the column to move the task to.');
    const column = this._requireColumn(columnKey);
    const order = Number.isFinite(sortOrder) ? sortOrder : this._tasks.nextSortOrder(column.key);
    if (!current.sourceId) {
      const task = this._tasks.update(id, { column_key: column.key, sort_order: order });
      this._emit('task.changed', { taskId: id, reason: 'moved' });
      return { task, moved: true, pushed: false };
    }
    const target = await this._statusForMove(current, column, status);
    if (target.needsStatus) return { task: current, moved: false, pushed: false, ...target };
    let task = this._tasks.update(id, { column_key: column.key, sort_order: order, pending_status: target.status });
    const reply = { task, moved: true, pushed: false };
    const outcome = await this._pushPendingStatus(task);
    task = outcome.task;
    reply.task = task;
    reply.pushed = outcome.pushed;
    if (outcome.error) reply.pushError = outcome.error;
    this._emit('task.changed', { taskId: id, reason: 'moved' });
    return reply;
  }

  setTasksHidden(ids, hidden = true) {
    const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
    for (const id of list) this._requireTask(id);
    const changed = this._tasks.setHidden(list, hidden);
    if (changed) this._emit('task.changed', { taskIds: list, reason: hidden ? 'hidden' : 'unhidden' });
    return changed;
  }

  async listTaskTargets() {
    const targets = [];
    for (const source of this._sources.list()) {
      const ctx = source.enabled ? this._sourceContext(source) : null;
      if (ctx) targets.push(await this._target(ctx));
    }
    return targets;
  }

  archiveTask(id) {
    this._requireTask(id);
    const task = this._tasks.update(id, { archived: 1 });
    this._emit('task.changed', { taskId: id, reason: 'archived' });
    return task;
  }


  listMessages(taskId) {
    return this._messages.listForTask(taskId);
  }

  async addMessage(taskId, body, { author = BoardService.DEFAULT_AUTHOR } = {}) {
    const task = this._requireTask(taskId);
    const text = String(body || '').trim();
    if (!text) throw new Error('A message needs some text.');
    let message = this._messages.insert({ id: RecordId.create(BoardService.MESSAGE_ID_PREFIX), taskId, author, body: text, at: this._now().toISOString(), direction: 'local', synced: false });
    const reply = { message, synced: false };
    if (task.sourceId) {
      const error = await this._pushMessage(task, message);
      message = this._messages.get(message.id);
      reply.message = message;
      reply.synced = message.synced;
      if (error) reply.syncError = error;
    }
    this._emit('task.changed', { taskId, reason: 'message' });
    return reply;
  }


  listSources() {
    return this._sources.list().map((s) => this._publicSource(s));
  }

  addSource({ kind = BoardService.DEFAULT_KIND, label, config = {}, intervalMs } = {}) {
    const provider = this._requireProvider(kind);
    const name = String(label || '').trim();
    if (!name) throw new Error('A task source needs a label.');
    const { token, ...rest } = config || {};
    const problem = provider.validateConfig(rest);
    if (problem) throw new Error(problem);
    const id = RecordId.create(BoardService.SOURCE_ID_PREFIX);
    if (token) this._secrets.set(BoardService.tokenId(id), String(token));
    this._sources.insert({ id, kind, label: name, config: rest, enabled: true, intervalMs: BoardService.clampInterval(intervalMs) });
    this._sources.update(id, { next_sync_at: this._now().toISOString() });
    this._emit('board.changed', { reason: 'source' });
    return this._publicSource(this._sources.get(id));
  }

  updateSource(id, patch = {}) {
    const current = this._sources.get(id);
    if (!current) throw new Error('Task source not found.');
    const columns = {};
    if (patch.label !== undefined) columns.label = String(patch.label).trim() || current.label;
    if (patch.enabled !== undefined) columns.enabled = patch.enabled ? 1 : 0;
    if (patch.intervalMs !== undefined) columns.interval_ms = BoardService.clampInterval(patch.intervalMs);
    if (patch.config && typeof patch.config === 'object') columns.config = this._mergedConfig(id, current, patch.config);
    const source = Object.keys(columns).length ? this._sources.update(id, columns) : current;
    if (columns.config) this._reflow(source);
    this._emit('board.changed', { reason: 'source' });
    return this._publicSource(source);
  }

  removeSource(id) {
    if (!this._sources.get(id)) return false;
    this._tasks.deleteForSource(id);
    this._secrets.delete(BoardService.tokenId(id));
    const removed = this._sources.delete(id);
    this._emit('board.changed', { reason: 'source' });
    return removed;
  }

  async discover({ sourceId = null, token = null, kind = BoardService.DEFAULT_KIND } = {}) {
    const source = sourceId ? this._sources.get(sourceId) : null;
    const provider = this._requireProvider(source ? source.kind : kind);
    const useToken = token || (source ? this._secrets.get(BoardService.tokenId(source.id)) : null);
    if (!useToken) throw new Error('A ClickUp API token is required.');
    return provider.discover({ token: useToken, fetchImpl: this._fetchImpl });
  }


  async syncSource(source) {
    const result = { sourceId: source.id, status: 'ok', count: 0 };
    try {
      result.count = await this._pull(source);
      const failed = await this._pushPending(this._sources.get(source.id) || source);
      if (failed) result.pushErrors = failed;
    } catch (err) {
      result.status = 'error';
      result.error = (err && err.message) || String(err);
    }
    this._recordSync(source, result);
    this._emit('task.changed', { sourceId: source.id, reason: 'sync' });
    return result;
  }

  static tokenId(sourceId) {
    return `hub:task:${sourceId}:token`;
  }

  static clampInterval(ms) {
    const n = parseInt(ms, 10);
    if (!Number.isFinite(n)) return BoardService.DEFAULT_INTERVAL_MS;
    return Math.min(BoardService.MAX_INTERVAL_MS, Math.max(BoardService.MIN_INTERVAL_MS, n));
  }


  static _cleanColumns(columns) {
    if (!Array.isArray(columns) || !columns.length) throw new Error('The board needs at least one column.');
    const seen = new Set();
    const clean = columns.map((c, index) => BoardService._cleanColumn(c, index, seen));
    const doneCount = clean.filter((c) => c.isDone).length;
    if (doneCount > 1) throw new Error('Only one column can be the done column.');
    if (doneCount === 0) clean[clean.length - 1].isDone = true;
    return clean;
  }

  static _cleanColumn(column, index, seen) {
    const key = String((column && column.key) || '').trim().toLowerCase();
    if (!BoardService.COLUMN_KEY_PATTERN.test(key)) throw new Error(`Column key "${key}" must be lowercase kebab-case.`);
    if (seen.has(key)) throw new Error(`Column key "${key}" is used twice.`);
    seen.add(key);
    const title = String((column && column.title) || '').trim();
    if (!title) throw new Error(`Column "${key}" needs a title.`);
    return { id: `${BoardService.COLUMN_ID_PREFIX}_${key}`, key, title, sortOrder: index, isDone: !!(column && column.isDone) };
  }

  static _uniqueKey(title, columns) {
    const base = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'column';
    const taken = new Set(columns.map((c) => c.key));
    let key = base;
    for (let n = 2; taken.has(key); n++) key = `${base}-${n}`;
    return key;
  }

  _dropColumns(previous, kept) {
    const keptKeys = new Set(kept.map((c) => c.key));
    const fallback = kept[0].key;
    for (const column of previous) {
      if (keptKeys.has(column.key)) continue;
      for (const task of this._tasks.list({ columnKey: column.key, includeHidden: true })) this._tasks.update(task.id, { column_key: fallback });
      this._columns.delete(column.key);
    }
  }

  _pruneLinks(columnKeys) {
    for (const source of this._sources.list()) {
      const pruned = StatusMapping.prune(source.config, columnKeys);
      this._reflow(pruned ? this._sources.update(source.id, { config: pruned }) : source);
    }
  }

  _requireColumn(columnKey) {
    const columns = this._columns.list();
    if (!columns.length) throw new Error('The board has no columns.');
    if (!columnKey) return columns[0];
    const column = columns.find((c) => c.key === columnKey);
    if (!column) throw new Error(`Unknown column "${columnKey}".`);
    return column;
  }


  _link(source, status, columnKey) {
    const updated = this._sources.update(source.id, { config: StatusMapping.link(source.config, status, columnKey) });
    this._reflow(updated);
    return updated;
  }

  _reflow(source) {
    if (!source) return;
    const columns = this._columns.list();
    for (const task of this._tasks.list({ sourceId: source.id, includeHidden: true })) {
      if (task.pendingStatus) continue;
      const key = StatusMapping.columnKeyForStatus(columns, source, task.remoteStatus);
      if (key !== task.columnKey) this._tasks.update(task.id, { column_key: key, sort_order: this._tasks.nextSortOrder(key) });
    }
  }

  async _statusForMove(task, column, picked) {
    const source = this._sources.get(task.sourceId);
    const ctx = source ? this._sourceContext(source) : null;
    const statuses = ctx ? await this._lists.statuses(ctx, task.listId) : null;
    if (picked) {
      const found = statuses ? statuses.find((s) => StatusMapping.matches(s.status, picked)) : { status: String(picked) };
      if (!found) throw new Error(`"${picked}" is not a status of ${task.listName || 'this list'}.`);
      if (source) this._link(source, found.status, column.key);
      return { status: found.status };
    }
    const status = StatusMapping.statusForColumn(this._columns.list(), source, column.key, statuses);
    if (status) return { status };
    return { needsStatus: true, column: { key: column.key, title: column.title }, statuses: this._describeStatuses(source, statuses || []) };
  }

  _describeStatuses(source, statuses) {
    const columns = this._columns.list();
    return statuses.map((s) => {
      const column = StatusMapping.columnForStatus(columns, source, s.status);
      return { status: s.status, type: s.type || '', color: s.color || '', columnKey: column ? column.key : null, columnTitle: column ? column.title : null };
    });
  }


  _requireTask(id) {
    const task = this._tasks.get(id);
    if (!task) throw new Error('Task not found.');
    return task;
  }

  static _taskPatchColumns(patch) {
    const columns = {};
    if (patch.title !== undefined) {
      const title = String(patch.title).trim();
      if (!title) throw new Error('A task needs a title.');
      columns.title = title;
    }
    if (patch.description !== undefined) columns.description = String(patch.description || '');
    if (patch.priority !== undefined) columns.priority = String(patch.priority || '');
    if (patch.dueAt !== undefined) columns.due_at = patch.dueAt || null;
    if (patch.tags !== undefined) columns.tags = Array.isArray(patch.tags) ? patch.tags.map(String) : [];
    return columns;
  }

  static _withSource(task, source) {
    return { ...task, sourceLabel: source ? source.label : '', sourceKind: source ? source.kind : '' };
  }

  _publicSource(source) {
    const { token, ...config } = source.config || {};
    return { ...source, config, connected: !!this._secrets.has(BoardService.tokenId(source.id)) };
  }

  _mergedConfig(id, current, patchConfig) {
    const { token, ...rest } = patchConfig;
    if (token) this._secrets.set(BoardService.tokenId(id), String(token));
    const merged = { ...current.config, ...rest };
    const problem = this._requireProvider(current.kind).validateConfig(merged);
    if (problem) throw new Error(problem);
    return merged;
  }

  _requireProvider(kind) {
    const provider = this._providers[kind];
    if (!provider) throw new Error(`No task provider for "${kind}".`);
    return provider;
  }

  _remoteContext(task) {
    const source = task.sourceId ? this._sources.get(task.sourceId) : null;
    return source ? this._sourceContext(source) : null;
  }

  _sourceContext(source) {
    const provider = this._providers[source.kind];
    const token = this._secrets.get(BoardService.tokenId(source.id));
    if (!provider || !token) return null;
    return { provider, token, source };
  }

  _recordTaskError(task, error) {
    const text = error ? String(error) : null;
    if ((task.syncError || null) === text) return task;
    const updated = this._tasks.update(task.id, { sync_error: text });
    if (text) this._announce(task, text);
    return updated;
  }

  _announce(task, message) {
    const source = task.sourceId ? this._sources.get(task.sourceId) : null;
    this._emit('board.error', { taskId: task.id, title: task.title, sourceLabel: source ? source.label : '', message });
  }


  async _createRemoteTask(sourceId, column, { title, description, listId, status: picked }) {
    const source = this._sources.get(sourceId);
    if (!source) throw new Error('Task source not found.');
    const ctx = this._sourceContext(source);
    if (!ctx) throw new Error(`${source.label} is not connected; reconnect it in Settings.`);
    const listIds = (source.config && source.config.listIds) || [];
    const targetList = listId ? String(listId) : listIds[0];
    if (!targetList || !listIds.includes(targetList)) throw new Error(`${source.label} does not import that list.`);
    const synced = await this._ensureAssignee(ctx);
    const target = await this._statusForMove({ sourceId, listId: targetList, listName: '' }, column, picked);
    if (target.needsStatus) return target;
    const linked = this._sources.get(sourceId);
    const remote = await ctx.provider.createTask({
      token: ctx.token, listId: targetList, fetchImpl: this._fetchImpl,
      fields: { title, description, status: target.status, assigneeId: synced.config.assigneeId },
    });
    if (!remote.listName) remote.listName = await this._lists.listName({ ...ctx, source: linked }, targetList);
    const task = this._storeCreated(linked, remote);
    this._emit('task.changed', { taskId: task.id, reason: 'created' });
    return BoardService._withSource(task, linked);
  }

  _storeCreated(source, remote) {
    const key = StatusMapping.columnKeyForStatus(this._columns.list(), source, remote.status);
    const existing = this._tasks.findRemote(source.id, remote.remoteId);
    return existing ? this._updateRemote(existing, remote, key) : this._insertRemote(source, remote, key);
  }

  async _target(ctx) {
    const listIds = (ctx.source.config && ctx.source.config.listIds) || [];
    const target = { sourceId: ctx.source.id, label: ctx.source.label, kind: ctx.source.kind, lists: [] };
    let described = [];
    try { described = await this._lists.lists(ctx); } catch (err) { target.error = (err && err.message) || String(err); }
    for (const id of listIds) {
      const found = described.find((l) => l.id === id);
      target.lists.push({ id, name: (found && found.name) || this._knownListName(ctx.source.id, id) || `List ${id}` });
    }
    return target;
  }

  _knownListName(sourceId, listId) {
    const task = this._tasks.list({ sourceId, includeArchived: true, includeHidden: true }).find((t) => t.listId === listId && t.listName);
    return task ? task.listName : '';
  }


  async _pushFields(task, patch) {
    const ctx = this._remoteContext(task);
    if (!ctx) return BoardService.NOT_CONNECTED;
    const fields = {};
    if (patch.title !== undefined) fields.title = task.title;
    if (patch.description !== undefined) fields.description = task.description;
    try {
      await ctx.provider.pushFields({ token: ctx.token, remoteId: task.remoteId, fields, fetchImpl: this._fetchImpl });
      this._recordTaskError(task, null);
      return null;
    } catch (err) {
      const text = (err && err.message) || String(err);
      this._recordTaskError(task, text);
      return text;
    }
  }

  async _pushPendingStatus(task) {
    const ctx = this._remoteContext(task);
    if (!ctx) return { task: this._recordTaskError(task, BoardService.NOT_CONNECTED), pushed: false, error: BoardService.NOT_CONNECTED };
    const statuses = await this._lists.statuses(ctx, task.listId);
    if (statuses && !statuses.some((s) => StatusMapping.matches(s.status, task.pendingStatus))) return this._undoMove(ctx, task);
    try {
      await ctx.provider.pushStatus({ token: ctx.token, remoteId: task.remoteId, status: task.pendingStatus, fetchImpl: this._fetchImpl });
      const updated = this._tasks.update(task.id, { pending_status: null, remote_status: task.pendingStatus });
      return { task: this._recordTaskError(updated, null), pushed: true };
    } catch (err) {
      const text = (err && err.message) || String(err);
      return { task: this._recordTaskError(task, text), pushed: false, error: text };
    }
  }

  _undoMove(ctx, task) {
    const text = `${task.listName || 'The list'} has no "${task.pendingStatus}" status; the move was undone. Move it again to pick a status.`;
    const column = StatusMapping.columnKeyForStatus(this._columns.list(), ctx.source, task.remoteStatus);
    const updated = this._tasks.update(task.id, { pending_status: null, column_key: column, sort_order: this._tasks.nextSortOrder(column) });
    return { task: this._recordTaskError(updated, text), pushed: false, error: text };
  }

  async _pushMessage(task, message) {
    const ctx = this._remoteContext(task);
    const fail = (text) => {
      if (message.syncError !== text) this._announce(task, `Message not sent: ${text}`);
      this._messages.markSyncError(message.id, text);
      return text;
    };
    if (!ctx) return fail(BoardService.NOT_CONNECTED);
    try {
      const posted = await ctx.provider.postComment({ token: ctx.token, remoteId: task.remoteId, text: message.body, fetchImpl: this._fetchImpl });
      this._messages.markSynced(message.id, posted && posted.remoteId);
      return null;
    } catch (err) {
      return fail((err && err.message) || String(err));
    }
  }


  async _pull(source) {
    const ctx = this._sourceContext(source);
    if (!ctx) throw new Error('The source has no API token; reconnect it in Settings.');
    const synced = await this._ensureAssignee(ctx);
    const columns = this._columns.list();
    const startedAt = new Date().toISOString();
    const seen = [];
    const remoteTasks = await ctx.provider.fetchTasks(synced, {
      token: ctx.token,
      fetchImpl: this._fetchImpl,
      shouldFetchComments: (remote) => this._needsComments(synced.id, remote),
    });
    for (const remote of remoteTasks) {
      seen.push(remote.remoteId);
      this._upsertRemote(synced, columns, remote);
    }
    this._tasks.archiveMissing(synced.id, seen, { createdBefore: startedAt });
    return remoteTasks.length;
  }

  async _ensureAssignee(ctx) {
    if (ctx.source.config.assigneeId) return ctx.source;
    const assigneeId = await ctx.provider.resolveAssignee({ token: ctx.token, config: ctx.source.config, fetchImpl: this._fetchImpl });
    if (!assigneeId) throw new Error(`No member matches "${ctx.source.config.assignee || 'me'}" in the chosen lists.`);
    return this._sources.update(ctx.source.id, { config: { ...ctx.source.config, assigneeId } });
  }

  _needsComments(sourceId, remote) {
    const existing = this._tasks.findRemote(sourceId, remote.remoteId);
    if (!existing) return true;
    return !!remote.remoteUpdatedAt && (!existing.remoteUpdatedAt || remote.remoteUpdatedAt > existing.remoteUpdatedAt);
  }

  _upsertRemote(source, columns, remote) {
    const existing = this._tasks.findRemote(source.id, remote.remoteId);
    const key = StatusMapping.columnKeyForStatus(columns, source, remote.status);
    const task = existing ? this._updateRemote(existing, remote, key) : this._insertRemote(source, remote, key);
    for (const comment of remote.comments || []) this._importComment(task, comment);
  }

  _insertRemote(source, remote, columnKey) {
    return this._tasks.insert({
      id: RecordId.create(BoardService.TASK_ID_PREFIX),
      sourceId: source.id,
      remoteId: remote.remoteId,
      ...BoardService._remoteColumns(remote),
      columnKey,
      syncedAt: this._now().toISOString(),
    });
  }

  _updateRemote(existing, remote, columnKey) {
    const columns = BoardService._remoteRowColumns(remote);
    columns.synced_at = this._now().toISOString();
    columns.archived = 0;
    if (existing.pendingStatus && BoardService._sameStatus(existing.pendingStatus, remote.status)) columns.pending_status = null;
    if (!existing.pendingStatus || columns.pending_status === null) {
      columns.column_key = columnKey;
      columns.sync_error = null;
    }
    if (existing.hidden && columns.column_key && columns.column_key !== existing.columnKey) columns.hidden = 0;
    return this._tasks.update(existing.id, columns);
  }

  static _remoteColumns(remote) {
    return {
      title: remote.title, description: remote.description, remoteStatus: remote.status, remoteStatusColor: remote.statusColor,
      priority: remote.priority, dueAt: remote.dueAt, url: remote.url, listId: remote.listId, listName: remote.listName,
      spaceName: remote.spaceName, assignees: remote.assignees || [], tags: remote.tags || [], remoteUpdatedAt: remote.remoteUpdatedAt,
    };
  }

  static _remoteRowColumns(remote) {
    return {
      title: remote.title || '', description: remote.description || '', remote_status: remote.status || '',
      remote_status_color: remote.statusColor || '', priority: remote.priority || '', due_at: remote.dueAt || null, url: remote.url || '',
      list_id: remote.listId || '', list_name: remote.listName || '', space_name: remote.spaceName || '',
      assignees: remote.assignees || [], tags: remote.tags || [], remote_updated_at: remote.remoteUpdatedAt || null,
    };
  }

  static _sameStatus(a, b) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  _importComment(task, comment) {
    if (!comment || !comment.remoteId || this._messages.findRemote(task.id, comment.remoteId)) return;
    this._messages.insert({
      id: RecordId.create(BoardService.MESSAGE_ID_PREFIX),
      taskId: task.id,
      remoteId: comment.remoteId,
      author: comment.author || '',
      body: comment.body || '',
      at: comment.at || this._now().toISOString(),
      direction: 'remote',
      synced: true,
    });
  }

  async _pushPending(source) {
    let failed = 0;
    for (const task of this._tasks.pendingStatusPush(source.id)) {
      if (!(await this._pushPendingStatus(task)).pushed) failed += 1;
    }
    for (const message of this._messages.unsyncedForSource(source.id)) {
      const task = this._tasks.get(message.taskId);
      if (task && await this._pushMessage(task, message)) failed += 1;
    }
    return failed;
  }

  _recordSync(source, result) {
    const now = this._now();
    this._sources.recordSync(source.id, {
      status: result.status,
      error: result.error || (result.pushErrors ? `${result.pushErrors} change${result.pushErrors === 1 ? '' : 's'} could not reach the tracker; see the board.` : null),
      lastSyncAt: now.toISOString(),
      nextSyncAt: new Date(now.getTime() + (source.intervalMs || BoardService.DEFAULT_INTERVAL_MS)).toISOString(),
    });
  }
}

module.exports = BoardService;
