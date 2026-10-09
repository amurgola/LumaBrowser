class DatabaseService {
  static ALWAYS_ALLOWED_TABLE = 'settings';
  static TABLE_REFERENCE_PATTERN = /(?:from|into|update|join)\s+(\w+)/gi;

  constructor(db, namespace, allowedTables = []) {
    this._db = db;
    this._namespace = namespace;
    this._allowedTables = new Set(allowedTables);
  }

  get(key, defaultValue = null) {
    return this._db.get(this._namespacedKey(key), defaultValue);
  }

  set(key, value) {
    this._db.set(this._namespacedKey(key), value);
  }

  delete(key) {
    this._db.delete(this._namespacedKey(key));
  }

  getAll(prefix = '') {
    const fullPrefix = prefix ? this._namespacedKey(prefix) : this._namespace;
    return this._db.getAllKeysWithPrefix(fullPrefix);
  }

  hasTableAccess(tableName) {
    return this._allowedTables.has(tableName);
  }

  query(sql, ...params) {
    this._checkSqlTableAccess(sql);
    return this._db.db.prepare(sql).all(...params);
  }

  run(sql, ...params) {
    this._checkSqlTableAccess(sql);
    return this._db.db.prepare(sql).run(...params);
  }

  getRawDb() {
    return this._db;
  }

  getNamespace() {
    return this._namespace;
  }

  addWatcher(watcher) { return this._delegate('network_watchers', 'addWatcher', watcher); }
  hasWatcher(urlPattern, method) { return this._delegate('network_watchers', 'hasWatcher', urlPattern, method); }
  updateWatcher(id, data) { return this._delegate('network_watchers', 'updateWatcher', id, data); }
  removeWatcher(id) { return this._delegate('network_watchers', 'removeWatcher', id); }
  getAllWatchers() { return this._delegate('network_watchers', 'getAllWatchers'); }

  _namespacedKey(key) {
    return `${this._namespace}.${key}`;
  }

  _delegate(tableName, method, ...args) {
    this._requireTable(tableName);
    return this._db[method](...args);
  }

  _requireTable(tableName) {
    if (this._allowedTables.has(tableName)) return;
    throw new Error(
      `DatabaseService [${this._namespace}]: no access to table "${tableName}". ` +
      `Allowed tables: [${[...this._allowedTables].join(', ')}]`
    );
  }

  _checkSqlTableAccess(sql) {
    for (const table of this._referencedTables(sql)) {
      if (table === DatabaseService.ALWAYS_ALLOWED_TABLE || this._allowedTables.has(table)) continue;
      throw new Error(`DatabaseService [${this._namespace}]: SQL references table "${table}" which is not allowed`);
    }
  }

  _referencedTables(sql) {
    const pattern = new RegExp(DatabaseService.TABLE_REFERENCE_PATTERN);
    return [...sql.toLowerCase().matchAll(pattern)].map((match) => match[1]);
  }
}

module.exports = DatabaseService;
