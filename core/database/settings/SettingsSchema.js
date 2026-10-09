const AppTablesSchema = require('./schema/AppTablesSchema');
const ChatTablesSchema = require('./schema/ChatTablesSchema');
const ScheduledWorkTablesSchema = require('./schema/ScheduledWorkTablesSchema');
const TriggerTablesSchema = require('./schema/TriggerTablesSchema');
const BrowserTablesSchema = require('./schema/BrowserTablesSchema');
const SettingsMigrations = require('./SettingsMigrations');

class SettingsSchema {
  static TABLE_GROUPS = [AppTablesSchema, ChatTablesSchema, ScheduledWorkTablesSchema, TriggerTablesSchema, BrowserTablesSchema];

  static apply(db) {
    SettingsSchema._createTables(db);
    SettingsMigrations.apply(db);
    SettingsSchema._createPostMigrationIndexes(db);
  }

  static _createTables(db) {
    for (const group of SettingsSchema.TABLE_GROUPS) db.exec(group.SQL);
  }

  static _createPostMigrationIndexes(db) {
    db.exec(ChatTablesSchema.POST_MIGRATION_SQL);
  }
}

module.exports = SettingsSchema;
