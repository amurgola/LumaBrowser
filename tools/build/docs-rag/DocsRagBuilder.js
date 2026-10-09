const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const PrebuiltRagMeta = require('../../../core/rag/PrebuiltRagMeta');
const RagStore = require('../../../core/rag/RagStore');
const ChunkBudget = require('../../../core/rag/ChunkBudget');
const TextChunker = require('../../../core/rag/TextChunker');
const DocsPageSet = require('./DocsPageSet');

class DocsRagBuilder {
  static SCOPE = 'docs:lumabrowser';
  static DB_NAME = 'docs-rag.db';
  static CHUNK_TOKENS = ChunkBudget.BUDGET_TOKENS;

  static defaultOutPath(rootDir) {
    return path.join(rootDir, 'dist', 'docs-rag', DocsRagBuilder.DB_NAME);
  }

  constructor({ rootDir, outPath, pageSet, version, log = console.log } = {}) {
    this._rootDir = rootDir;
    this._outPath = outPath || DocsRagBuilder.defaultOutPath(rootDir);
    this._pageSet = pageSet || new DocsPageSet({ rootDir });
    this._version = version || DocsRagBuilder._packageVersion(rootDir);
    this._log = log;
  }

  run() {
    const pages = this._pageSet.list();
    if (pages.length === 0) {
      throw new Error(`No documentation pages found under ${path.join(this._rootDir, DocsPageSet.DOCS_DIR)}`);
    }
    this._log(`[build-docs-rag] ${pages.length} pages (${this._pageSet.mode} checkout)`);
    const tempPath = DocsRagBuilder._tempPath(this._outPath);
    DocsRagBuilder._removeDatabase(tempPath);
    const report = this._write(tempPath, pages);
    DocsRagBuilder._removeDatabase(this._outPath);
    fs.renameSync(tempPath, this._outPath);
    report.bytes = fs.statSync(this._outPath).size;
    this._log(`[build-docs-rag] ${this._outPath}: ${report.documents} documents, ${report.chunks} chunks, ${report.bytes} bytes`);
    return report;
  }

  _write(dbPath, pages) {
    const store = new RagStore({ dbPath });
    try {
      const report = this._ingestAll(store, pages);
      PrebuiltRagMeta.write(store.db, this._meta(report));
      DocsRagBuilder._finish(store.db);
      return report;
    } finally {
      store.close();
    }
  }

  _ingestAll(store, pages) {
    const report = {
      outPath: this._outPath, documents: 0, chunks: 0, skipped: [], contentHash: DocsRagBuilder.contentHash(pages),
    };
    const ingestAll = store.db.transaction(() => {
      for (const page of pages) this._ingestOne(store, page, report);
    });
    ingestAll();
    return report;
  }

  _ingestOne(store, { rel, text }, report) {
    const chunks = DocsRagBuilder.chunk(rel, text);
    if (chunks.length === 0) { report.skipped.push(rel); return; }
    const { id, deduped } = store.addDocument({
      scope: DocsRagBuilder.SCOPE, filename: rel, sha256: DocsRagBuilder.sha256(text), pages: 1,
    });
    if (deduped) { report.skipped.push(rel); return; }
    report.documents += 1;
    report.chunks += store.addChunks(id, DocsRagBuilder.SCOPE, chunks);
  }

  static chunk(rel, text) {
    return TextChunker.chunkText(text, { maxTokens: DocsRagBuilder.CHUNK_TOKENS })
      .map((chunk) => ({ page: 1, text: `${rel}\n${chunk.text}`, charStart: chunk.charStart, charEnd: chunk.charEnd }));
  }

  _meta(report) {
    return {
      scope: DocsRagBuilder.SCOPE,
      contentHash: report.contentHash,
      builtAt: new Date().toISOString(),
      appVersion: this._version || '',
      documents: report.documents,
      chunks: report.chunks,
      chunkTokens: DocsRagBuilder.CHUNK_TOKENS,
    };
  }

  static contentHash(pages) {
    const hash = crypto.createHash('sha256');
    for (const { rel, text } of pages) hash.update(`${rel}\0${DocsRagBuilder.sha256(text)}\n`);
    return hash.digest('hex');
  }

  static sha256(text) {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  }

  static _finish(db) {
    db.exec("INSERT INTO chunks_fts(chunks_fts) VALUES ('optimize')");
    db.pragma('journal_mode = DELETE');
    db.exec('VACUUM');
  }

  static _tempPath(outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    return `${outPath}.building`;
  }

  static _removeDatabase(dbPath) {
    for (const suffix of ['', '-wal', '-shm', '-journal']) fs.rmSync(`${dbPath}${suffix}`, { force: true });
  }

  static _packageVersion(rootDir) {
    try {
      return JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version || '';
    } catch (_) {
      return '';
    }
  }
}

module.exports = DocsRagBuilder;
