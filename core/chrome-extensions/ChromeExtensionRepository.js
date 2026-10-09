class ChromeExtensionRepository {
  constructor(db) {
    this._db = db;
  }

  list() {
    return this._db.prepare('SELECT * FROM chrome_extensions ORDER BY installed_at DESC').all();
  }

  listEnabled() {
    return this._db.prepare('SELECT * FROM chrome_extensions WHERE enabled = 1').all();
  }

  get(id) {
    return this._db.prepare('SELECT * FROM chrome_extensions WHERE id = ?').get(id) || null;
  }

  upsert(row) {
    this._db.prepare(
      `INSERT INTO chrome_extensions
       (id, name, version, path, manifest_version, enabled, installed_at, source)
       VALUES (@id, @name, @version, @path, @manifest_version, @enabled, @installed_at, @source)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         version = excluded.version,
         path = excluded.path,
         manifest_version = excluded.manifest_version,
         enabled = 1,
         installed_at = excluded.installed_at,
         source = excluded.source`,
    ).run(row);
  }

  setEnabled(id, enabled) {
    this._db.prepare('UPDATE chrome_extensions SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  }

  remove(id) {
    this._db.prepare('DELETE FROM chrome_extensions WHERE id = ?').run(id);
  }
}

module.exports = ChromeExtensionRepository;
