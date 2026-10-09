class TaskMessageRepository {
  constructor(db) {
    this._db = db;
  }

  get(id) {
    const row = this._db.query('SELECT * FROM hub_task_messages WHERE id = ?', id)[0];
    return row ? TaskMessageRepository.hydrate(row) : null;
  }

  listForTask(taskId, { limit = 200 } = {}) {
    return this._db.query('SELECT * FROM hub_task_messages WHERE task_id = ? ORDER BY at ASC LIMIT ?', taskId, limit)
      .map(TaskMessageRepository.hydrate);
  }

  findRemote(taskId, remoteId) {
    const row = this._db.query('SELECT * FROM hub_task_messages WHERE task_id = ? AND remote_id = ?', taskId, remoteId)[0];
    return row ? TaskMessageRepository.hydrate(row) : null;
  }

  insert(row) {
    this._db.run(
      `INSERT INTO hub_task_messages (id, task_id, remote_id, author, body, at, direction, synced, sync_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      row.id, row.taskId, row.remoteId || null, row.author || '', row.body || '', row.at, row.direction || 'local', row.synced ? 1 : 0,
    );
    return this.get(row.id);
  }

  markSynced(id, remoteId) {
    this._db.run('UPDATE hub_task_messages SET synced = 1, remote_id = ?, sync_error = NULL WHERE id = ?', remoteId || null, id);
  }

  markSyncError(id, error) {
    this._db.run('UPDATE hub_task_messages SET synced = 0, sync_error = ? WHERE id = ?', String(error || ''), id);
  }

  unsyncedForSource(sourceId) {
    return this._db.query(
      `SELECT m.* FROM hub_task_messages m JOIN hub_tasks t ON t.id = m.task_id WHERE t.source_id = ? AND m.direction = 'local' AND m.synced = 0 ORDER BY m.at ASC`,
      sourceId,
    ).map(TaskMessageRepository.hydrate);
  }

  static hydrate(row) {
    return {
      id: row.id,
      taskId: row.task_id,
      remoteId: row.remote_id,
      author: row.author || '',
      body: row.body,
      at: row.at,
      direction: row.direction,
      synced: !!row.synced,
      syncError: row.sync_error,
    };
  }
}

module.exports = TaskMessageRepository;
