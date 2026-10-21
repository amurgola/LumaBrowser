const SettingsValueCodec = require('./SettingsValueCodec');
const PathPrefixRewrite = require('./PathPrefixRewrite');

class SettingsRepository {
  constructor(db) {
    this._db = db;
    this._statements = new Map();
  }

  get(key, defaultValue = null) {
    const row = this._statement('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? SettingsValueCodec.decode(row.value) : defaultValue;
  }

  set(key, value) {
    this._upsertRaw(key, SettingsValueCodec.encode(value));
  }

  delete(key) {
    this._statement('DELETE FROM settings WHERE key = ?').run(key);
  }

  has(key) {
    return !!this._statement('SELECT key FROM settings WHERE key = ?').get(key);
  }

  getAllKeysWithPrefix(prefix) {
    const rows = this._statement('SELECT key, value FROM settings WHERE key LIKE ?').all(`${prefix}%`);
    return Object.fromEntries(rows.map((row) => [row.key, SettingsValueCodec.decode(row.value)]));
  }

  migrateKeys(mappings) {
    let migrated = 0;
    this._db.transaction(() => {
      for (const { from, to } of mappings) {
        if (this._moveRawValue(from, to)) migrated++;
      }
    })();
    return migrated;
  }

  replacePathPrefix(oldPrefix, newPrefix) {
    const variants = PathPrefixRewrite.variants(oldPrefix, newPrefix);
    if (!variants.length) return 0;
    const rows = this._db.prepare('SELECT key, value FROM settings').all();
    return rows.filter((row) => this._rewriteRow(row, variants)).length;
  }

  _moveRawValue(from, to) {
    const row = this._statement('SELECT value FROM settings WHERE key = ?').get(from);
    if (!row) return false;
    if (!this.has(to)) this._upsertRaw(to, row.value);
    this.delete(from);
    return true;
  }

  _rewriteRow({ key, value }, variants) {
    const next = PathPrefixRewrite.apply(value, variants);
    if (next === value) return false;
    this._db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(next, key);
    return true;
  }

  _upsertRaw(key, text) {
    this._statement('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(key, text);
  }

  _statement(sql) {
    let statement = this._statements.get(sql);
    if (!statement) {
      statement = this._db.prepare(sql);
      this._statements.set(sql, statement);
    }
    return statement;
  }
}

module.exports = SettingsRepository;
