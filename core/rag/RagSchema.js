class RagSchema {
  static DDL = `
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      scope TEXT NOT NULL,
      filename TEXT,
      sha256 TEXT NOT NULL,
      pages INTEGER,
      created INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_documents_scope ON documents(scope);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_hash ON documents(scope, sha256);

    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY,
      doc_id INTEGER NOT NULL,
      scope TEXT NOT NULL,
      page INTEGER,
      text TEXT NOT NULL,
      char_start INTEGER,
      char_end INTEGER,
      embedding BLOB
    );
    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_scope ON chunks(scope);

    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts
      USING fts5(text, content='chunks', content_rowid='id');

    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
      INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
    END;
    CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES('delete', old.id, old.text);
    END;
    CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES('delete', old.id, old.text);
      INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
    END;
  `;

  static ensure(db) {
    db.exec(RagSchema.DDL);
  }
}

module.exports = RagSchema;
