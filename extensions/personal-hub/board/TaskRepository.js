const JsonColumn = require('../../../core/database/JsonColumn');

class TaskRepository {
  constructor(db) {
    this._db = db;
  }

  get(id) {
    const row = this._db.query('SELECT * FROM hub_tasks WHERE id = ?', id)[0];
    return row ? TaskRepository.hydrate(row) : null;
  }

  findRemote(sourceId, remoteId) {
    const row = this._db.query('SELECT * FROM hub_tasks WHERE source_id = ? AND remote_id = ?', sourceId, remoteId)[0];
    return row ? TaskRepository.hydrate(row) : null;
  }

  list({ columnKey = null, sourceId = null, includeArchived = false, includeHidden = false, limit = 1000 } = {}) {
    const where = [];
    const params = [];
    if (!includeArchived) where.push('archived = 0');
    if (!includeHidden) where.push('hidden = 0');
    if (columnKey) { where.push('column_key = ?'); params.push(columnKey); }
    if (sourceId) { where.push('source_id = ?'); params.push(sourceId); }
    const sql = `SELECT * FROM hub_tasks${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY column_key ASC, sort_order ASC, created_at ASC LIMIT ?`;
    return this._db.query(sql, ...params, limit).map(TaskRepository.hydrate);
  }

  insert(row) {
    const now = new Date().toISOString();
    this._db.run(
      `INSERT INTO hub_tasks (id, source_id, remote_id, title, description, column_key, remote_status, remote_status_color, priority, due_at, url, list_id, list_name, space_name, assignees, tags, sort_order, archived, hidden, pending_status, remote_updated_at, synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?, ?, ?)`,
      row.id, row.sourceId || null, row.remoteId || null, row.title || '', row.description || '', row.columnKey || 'todo',
      row.remoteStatus || '', row.remoteStatusColor || '', row.priority || '', row.dueAt || null, row.url || '', row.listId || '',
      row.listName || '', row.spaceName || '',
      JSON.stringify(row.assignees || []), JSON.stringify(row.tags || []), row.sortOrder != null ? row.sortOrder : this.nextSortOrder(row.columnKey || 'todo'),
      row.remoteUpdatedAt || null, row.syncedAt || null, now, now,
    );
    return this.get(row.id);
  }

  update(id, columns) {
    const cols = { ...columns, updated_at: new Date().toISOString() };
    for (const key of ['assignees', 'tags']) {
      if (cols[key] !== undefined && typeof cols[key] !== 'string') cols[key] = JSON.stringify(cols[key]);
    }
    const names = Object.keys(cols);
    this._db.run(`UPDATE hub_tasks SET ${names.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`, ...Object.values(cols), id);
    return this.get(id);
  }

  nextSortOrder(columnKey) {
    const row = this._db.query('SELECT MAX(sort_order) AS m FROM hub_tasks WHERE column_key = ? AND archived = 0', columnKey)[0];
    return ((row && row.m) || 0) + 1;
  }

  archiveMissing(sourceId, keepRemoteIds, { createdBefore = null } = {}) {
    const keep = Array.isArray(keepRemoteIds) ? keepRemoteIds : [];
    const placeholders = keep.length ? ` AND remote_id NOT IN (${keep.map(() => '?').join(', ')})` : '';
    const created = createdBefore ? ' AND created_at <= ?' : '';
    return this._db.run(
      `UPDATE hub_tasks SET archived = 1, updated_at = ? WHERE source_id = ? AND archived = 0${placeholders}${created}`,
      new Date().toISOString(), sourceId, ...keep, ...(createdBefore ? [createdBefore] : []),
    ).changes;
  }

  setHidden(ids, hidden) {
    const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean).map(String);
    if (!list.length) return 0;
    return this._db.run(
      `UPDATE hub_tasks SET hidden = ?, updated_at = ? WHERE id IN (${list.map(() => '?').join(', ')})`,
      hidden ? 1 : 0, new Date().toISOString(), ...list,
    ).changes;
  }

  pendingStatusPush(sourceId) {
    return this._db.query('SELECT * FROM hub_tasks WHERE source_id = ? AND pending_status IS NOT NULL', sourceId).map(TaskRepository.hydrate);
  }

  delete(id) {
    this._db.run('DELETE FROM hub_task_messages WHERE task_id = ?', id);
    return this._db.run('DELETE FROM hub_tasks WHERE id = ?', id).changes > 0;
  }

  deleteForSource(sourceId) {
    for (const task of this.list({ sourceId, includeArchived: true, includeHidden: true, limit: 100000 })) this.delete(task.id);
  }

  static hydrate(row) {
    return {
      id: row.id,
      sourceId: row.source_id,
      remoteId: row.remote_id,
      title: row.title,
      description: row.description || '',
      columnKey: row.column_key,
      remoteStatus: row.remote_status || '',
      remoteStatusColor: row.remote_status_color || '',
      priority: row.priority || '',
      dueAt: row.due_at,
      url: row.url || '',
      listId: row.list_id || '',
      listName: row.list_name || '',
      spaceName: row.space_name || '',
      assignees: JsonColumn.parse(row.assignees, []) || [],
      tags: JsonColumn.parse(row.tags, []) || [],
      sortOrder: row.sort_order,
      archived: !!row.archived,
      hidden: !!row.hidden,
      pendingStatus: row.pending_status,
      syncError: row.sync_error || null,
      remoteUpdatedAt: row.remote_updated_at,
      syncedAt: row.synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = TaskRepository;
