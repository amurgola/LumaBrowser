const SqliteOpener = require('../database/SqliteOpener');
const RagSchema = require('./RagSchema');
const LexicalMatchExpression = require('./LexicalMatchExpression');
const EmbeddingVector = require('./EmbeddingVector');

class RagStore {
  static DEFAULT_SCOPE = 'kb';
  static LEXICAL_ROW_LIMIT = 40;

  constructor({ dbPath, db, readOnly = false } = {}) {
    this.db = db || RagStore._open(dbPath, readOnly);
    if (readOnly) return;
    this.db.pragma('journal_mode = WAL');
    RagSchema.ensure(this.db);
  }

  static _open(dbPath, readOnly) {
    if (!dbPath) throw new Error('RagStore needs a dbPath or an injected db.');
    return SqliteOpener.open(dbPath, readOnly ? { readOnly: true } : { mkdir: true });
  }

  getDocumentByHash(scope, sha256) {
    return this.db.prepare('SELECT * FROM documents WHERE scope = ? AND sha256 = ?').get(scope, sha256) || null;
  }

  addDocument({ scope = RagStore.DEFAULT_SCOPE, filename, sha256, pages = 0, created = null }) {
    const existing = this.getDocumentByHash(scope, sha256);
    if (existing) return { id: existing.id, deduped: true };
    const info = this.db.prepare(
      'INSERT INTO documents(scope, filename, sha256, pages, created) VALUES (?,?,?,?,?)',
    ).run(scope, filename || null, sha256, pages || 0, created || Date.now());
    return { id: Number(info.lastInsertRowid), deduped: false };
  }

  addChunks(docId, scope, chunks) {
    const insert = this.db.prepare(
      'INSERT INTO chunks(doc_id, scope, page, text, char_start, char_end, embedding) VALUES (?,?,?,?,?,?,?)',
    );
    const insertAll = this.db.transaction((rows) => {
      for (const chunk of rows) insert.run(...RagStore._chunkParams(docId, scope, chunk));
      return rows.length;
    });
    return insertAll(chunks || []);
  }

  static _chunkParams(docId, scope, chunk) {
    const embedding = chunk.embedding ? EmbeddingVector.pack(chunk.embedding) : null;
    return [docId, scope, chunk.page || 1, chunk.text, chunk.charStart ?? null, chunk.charEnd ?? null, embedding];
  }

  findKeywordPassages(scope, query, limit = RagStore.LEXICAL_ROW_LIMIT) {
    const match = LexicalMatchExpression.fromText(query);
    if (!match) return [];
    return this.db.prepare(`
      SELECT c.id, c.doc_id AS docId, c.page, c.text, d.filename, bm25(chunks_fts) AS rank
      FROM chunks_fts f
      JOIN chunks c ON c.id = f.rowid
      JOIN documents d ON d.id = c.doc_id
      WHERE chunks_fts MATCH ? AND c.scope = ?
      ORDER BY rank
      LIMIT ?
    `).all(match, scope, limit);
  }

  getChunks(ids) {
    if (!ids || !ids.length) return [];
    const placeholders = ids.map(() => '?').join(',');
    return this.db.prepare(`
      SELECT c.id, c.doc_id AS docId, c.page, c.text, c.char_start AS charStart,
             c.char_end AS charEnd, d.filename
      FROM chunks c JOIN documents d ON d.id = c.doc_id
      WHERE c.id IN (${placeholders})
    `).all(...ids);
  }

  denseCandidates(scope) {
    const rows = this.db.prepare(
      'SELECT id, embedding FROM chunks WHERE scope = ? AND embedding IS NOT NULL',
    ).all(scope);
    return rows.map((row) => ({ id: row.id, embedding: EmbeddingVector.unpack(row.embedding) }));
  }

  exportDocuments(scope = RagStore.DEFAULT_SCOPE) {
    const documents = this.db.prepare(
      'SELECT id, filename, sha256, pages, created FROM documents WHERE scope = ? ORDER BY created, id',
    ).all(scope);
    const chunkQuery = this.db.prepare(`
      SELECT page, text, char_start AS charStart, char_end AS charEnd, embedding
      FROM chunks WHERE doc_id = ? ORDER BY id
    `);
    return documents.map(({ id, ...document }) => ({ ...document, chunks: chunkQuery.all(id) }));
  }

  documentsInScope(scope = RagStore.DEFAULT_SCOPE) {
    return this.db.prepare(`
      SELECT d.id, d.filename, d.pages, d.created, COUNT(c.id) AS chunks
      FROM documents d LEFT JOIN chunks c ON c.doc_id = d.id
      WHERE d.scope = ? GROUP BY d.id ORDER BY d.created DESC
    `).all(scope);
  }

  removeDocument(id) {
    const remove = this.db.transaction((docId) => {
      this.db.prepare('DELETE FROM chunks WHERE doc_id = ?').run(docId);
      this.db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
    });
    remove(id);
    return { success: true };
  }

  count(scope = RagStore.DEFAULT_SCOPE) {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM documents WHERE scope = ?').get(scope);
    return row ? row.n : 0;
  }

  close() {
    try {
      this.db.close();
    } catch (_) {}
  }
}

module.exports = RagStore;
