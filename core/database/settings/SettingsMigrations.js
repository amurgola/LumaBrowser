const SqliteSchema = require('../SqliteSchema');
const MessageTree = require('../../llm-server/chat/MessageTree');

class SettingsMigrations {
  static ADDED_COLUMNS = [
    ['llm_conversations', 'tools_enabled', 'INTEGER NOT NULL DEFAULT 0'],
    ['llm_artifacts', 'root_id', 'TEXT'],
    ['llm_artifacts', 'version', 'INTEGER NOT NULL DEFAULT 1'],
    ['llm_triggers', 'consecutive_failures', 'INTEGER NOT NULL DEFAULT 0'],
    ['llm_triggers', 'paused_reason', 'TEXT'],
    ['llm_triggers', 'last_drift', 'TEXT'],
    ['llm_triggers', 'memory', 'TEXT'],
    ['llm_triggers', 'memory_at', 'TEXT'],
    ['llm_trigger_runs', 'attempt', 'INTEGER NOT NULL DEFAULT 1'],
    ['llm_trigger_runs', 'retry_of', 'TEXT'],
    ['llm_messages', 'variant_group', 'TEXT'],
    ['llm_messages', 'variant_active', 'INTEGER NOT NULL DEFAULT 1'],
    ['llm_conversations', 'mode', "TEXT NOT NULL DEFAULT 'chat'"],
    ['llm_conversations', 'disabled_tools', 'TEXT'],
    ['llm_conversations', 'hidden', 'INTEGER NOT NULL DEFAULT 0'],
    ['llm_conversations', 'choices_enabled', 'INTEGER'],
    ['llm_conversations', 'reasoning_effort', 'TEXT'],
    ['llm_messages', 'parent_id', 'TEXT'],
  ];

  static ARTIFACT_VERSION_COLUMNS = ['root_id', 'version'];

  static apply(db) {
    const added = SettingsMigrations._addMissingColumns(db);
    if (SettingsMigrations._addedArtifactVersioning(added)) SettingsMigrations._backfillArtifactRoots(db);
    if (added.includes('llm_messages.parent_id')) SettingsMigrations._backfillMessageParents(db);
    return added;
  }

  static _addMissingColumns(db) {
    return SettingsMigrations.ADDED_COLUMNS
      .filter(([table, column, ddl]) => SqliteSchema.ensureColumn(db, table, column, ddl))
      .map(([table, column]) => `${table}.${column}`);
  }

  static _addedArtifactVersioning(added) {
    return SettingsMigrations.ARTIFACT_VERSION_COLUMNS.some((column) => added.includes(`llm_artifacts.${column}`));
  }

  static _backfillArtifactRoots(db) {
    db.exec('UPDATE llm_artifacts SET root_id = id WHERE root_id IS NULL');
  }

  static _backfillMessageParents(db) {
    const convs = db.prepare('SELECT DISTINCT conversation_id FROM llm_messages').all();
    const list = db.prepare('SELECT id, variant_group, variant_active FROM llm_messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC');
    const set = db.prepare('UPDATE llm_messages SET parent_id = ? WHERE id = ?');
    db.transaction(() => {
      for (const { conversation_id: convId } of convs) {
        for (const [id, parent] of MessageTree.legacyParents(list.all(convId))) {
          if (parent) set.run(parent, id);
        }
      }
    })();
  }
}

module.exports = SettingsMigrations;
