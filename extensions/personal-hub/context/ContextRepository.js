class ContextRepository {
  constructor(db) {
    this._db = db;
  }

  list() {
    const rules = new Map();
    for (const row of this._db.query('SELECT * FROM hub_context_rules ORDER BY kind ASC, value ASC')) {
      if (!rules.has(row.context_id)) rules.set(row.context_id, []);
      rules.get(row.context_id).push({ kind: row.kind, value: row.value });
    }
    return this._db.query('SELECT * FROM hub_contexts ORDER BY sort_order ASC, name ASC')
      .map((row) => ({ id: row.id, name: row.name, color: row.color || '', sortOrder: row.sort_order, rules: rules.get(row.id) || [] }));
  }

  replaceAll(contexts) {
    this._db.run('DELETE FROM hub_context_rules');
    this._db.run('DELETE FROM hub_contexts');
    for (const context of contexts) {
      this._db.run('INSERT INTO hub_contexts (id, name, color, sort_order) VALUES (?, ?, ?, ?)',
        context.id, context.name, context.color || '', context.sortOrder || 0);
      for (const rule of context.rules || []) {
        this._db.run('INSERT INTO hub_context_rules (context_id, kind, value) VALUES (?, ?, ?)', context.id, rule.kind, rule.value);
      }
    }
    return this.list();
  }
}

module.exports = ContextRepository;
