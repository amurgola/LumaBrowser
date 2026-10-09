class ChatTablesSchema {
  static SQL = `
    CREATE TABLE IF NOT EXISTS llm_conversations (
      id               TEXT PRIMARY KEY,
      title            TEXT NOT NULL DEFAULT 'New chat',
      model_ref        TEXT,
      provider         TEXT,
      pinned           INTEGER NOT NULL DEFAULT 0,
      archived         INTEGER NOT NULL DEFAULT 0,
      hidden           INTEGER NOT NULL DEFAULT 0,
      tools_enabled    INTEGER NOT NULL DEFAULT 0,
      disabled_tools   TEXT,
      choices_enabled  INTEGER,
      reasoning_effort TEXT,
      mode             TEXT NOT NULL DEFAULT 'chat',
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS llm_conversation_meta (
      conversation_id TEXT PRIMARY KEY,
      mode            TEXT NOT NULL DEFAULT 'chat',
      data            TEXT NOT NULL DEFAULT '{}',
      updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES llm_conversations(id)
    );

    CREATE TABLE IF NOT EXISTS llm_messages (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role            TEXT NOT NULL,
      content         TEXT NOT NULL DEFAULT '',
      reasoning       TEXT,
      model_ref       TEXT,
      provider        TEXT,
      tokens_in       INTEGER,
      tokens_out      INTEGER,
      error           TEXT,
      tool_calls      TEXT,
      variant_group   TEXT,
      variant_active  INTEGER NOT NULL DEFAULT 1,
      parent_id       TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES llm_conversations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_llm_messages_conv
      ON llm_messages (conversation_id, created_at ASC);

    CREATE INDEX IF NOT EXISTS idx_llm_conversations_updated
      ON llm_conversations (pinned DESC, updated_at DESC);

    CREATE TABLE IF NOT EXISTS llm_artifacts (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT,
      message_id      TEXT,
      title           TEXT NOT NULL DEFAULT 'Artifact',
      type            TEXT NOT NULL DEFAULT 'html',
      language        TEXT,
      content         TEXT NOT NULL DEFAULT '',
      root_id         TEXT,
      version         INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_llm_artifacts_conv
      ON llm_artifacts (conversation_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS llm_artifact_data (
      root_id    TEXT PRIMARY KEY,
      data       TEXT NOT NULL DEFAULT '{}',
      rev        INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;

  static POST_MIGRATION_SQL = `
    CREATE INDEX IF NOT EXISTS idx_llm_artifacts_root
      ON llm_artifacts (root_id, version ASC);
  `;
}

module.exports = ChatTablesSchema;
