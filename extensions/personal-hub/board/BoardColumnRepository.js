class BoardColumnRepository {
  constructor(db) {
    this._db = db;
  }

  list() {
    return this._db.query('SELECT * FROM hub_board_columns ORDER BY sort_order ASC, title ASC').map(BoardColumnRepository.hydrate);
  }

  byKey(key) {
    const row = this._db.query('SELECT * FROM hub_board_columns WHERE key = ?', key)[0];
    return row ? BoardColumnRepository.hydrate(row) : null;
  }

  doneColumn() {
    const row = this._db.query('SELECT * FROM hub_board_columns WHERE is_done = 1 ORDER BY sort_order ASC LIMIT 1')[0];
    return row ? BoardColumnRepository.hydrate(row) : null;
  }

  upsert(row) {
    if (this.byKey(row.key)) {
      this._db.run('UPDATE hub_board_columns SET title = ?, sort_order = ?, is_done = ? WHERE key = ?',
        row.title, row.sortOrder || 0, row.isDone ? 1 : 0, row.key);
    } else {
      this._db.run('INSERT INTO hub_board_columns (id, key, title, sort_order, is_done) VALUES (?, ?, ?, ?, ?)',
        row.id, row.key, row.title, row.sortOrder || 0, row.isDone ? 1 : 0);
    }
    return this.byKey(row.key);
  }

  delete(key) {
    return this._db.run('DELETE FROM hub_board_columns WHERE key = ?', key).changes > 0;
  }

  static hydrate(row) {
    return { id: row.id, key: row.key, title: row.title, sortOrder: row.sort_order, isDone: !!row.is_done };
  }
}

module.exports = BoardColumnRepository;
