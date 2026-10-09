const path = require('path');
const SettingsDatabase = require('../../core/database/SettingsDatabase');
const AgentToolCatalog = require('../../core/llm-service/AgentToolCatalog');
const AppPaths = require('../../core/shared/AppPaths');

class SettingsBoot {
  static FILE_NAME = 'settings.db';
  static MIGRATION_KEY = 'migration.v2';

  constructor({ dataDir, appPaths = AppPaths, log = console }) {
    this._dataDir = dataDir;
    this._appPaths = appPaths;
    this._log = log;
  }

  open() {
    const db = new SettingsDatabase(path.join(this._dataDir, SettingsBoot.FILE_NAME));
    this._seedDefaultOffTools(db);
    this._followBaseDirMigration(db);
    return db;
  }

  markMigrated(db) {
    if (db.get(SettingsBoot.MIGRATION_KEY)) return false;
    db.set(SettingsBoot.MIGRATION_KEY, new Date().toISOString());
    this._log.log('Database migration v2: complete');
    return true;
  }

  _seedDefaultOffTools(db) {
    try {
      AgentToolCatalog.seedDefaultOffAgentTools(db);
    } catch (err) {
      this._log.warn('default-off tool seeding failed:', err.message);
    }
  }

  _followBaseDirMigration(db) {
    this._appPaths.appBaseDir();
    const migration = this._appPaths.appBaseDirMigration();
    if (!migration) return 0;
    const remapped = db.replacePathPrefix(migration.from, migration.to);
    if (remapped > 0) this._log.log(`[appPaths] remapped ${remapped} setting(s): ${migration.from} -> ${migration.to}`);
    return remapped;
  }
}

module.exports = SettingsBoot;
