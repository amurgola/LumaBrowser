const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const DocumentParser = require('./DocumentParser');
const RagEmbedder = require('./RagEmbedder');
const TextChunker = require('./TextChunker');

class RagFileIngestor {
  constructor(store) {
    this._store = store;
  }

  async ingest(filePath, scope) {
    try {
      const refusal = RagFileIngestor._refusal(filePath);
      if (refusal) return { success: false, error: refusal };
      const sha256 = RagFileIngestor._hashFile(filePath);
      const existing = this._store.getDocumentByHash(scope, sha256);
      if (existing) return { success: true, documentId: existing.id, chunks: 0, deduped: true };
      return await this._ingestNew(filePath, scope, sha256);
    } catch (err) {
      return { success: false, error: `Ingest failed: ${err.message}` };
    }
  }

  async _ingestNew(filePath, scope, sha256) {
    const pages = await DocumentParser.parse(filePath);
    if (!pages.length) return { success: false, error: 'No extractable text in that file.' };
    const chunks = TextChunker.chunkDocument(pages);
    if (!chunks.length) return { success: false, error: 'File parsed but produced no chunks.' };
    await RagFileIngestor._embed(chunks);
    return this._save(filePath, scope, sha256, pages.length, chunks);
  }

  _save(filePath, scope, sha256, pageCount, chunks) {
    const { id: documentId } = this._store.addDocument({ scope, filename: path.basename(filePath), sha256, pages: pageCount });
    const count = this._store.addChunks(documentId, scope, chunks);
    return { success: true, documentId, chunks: count, deduped: false };
  }

  static _refusal(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return `File not found: ${filePath}`;
    if (!DocumentParser.isSupported(filePath)) {
      return `Unsupported file type. Supported: ${DocumentParser.supportedExtensions().join(', ')}.`;
    }
    return null;
  }

  static _hashFile(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  }

  static async _embed(chunks) {
    if (!RagEmbedder.isConfigured()) return;
    const vectors = await RagEmbedder.embed(chunks.map((c) => c.text));
    if (vectors) chunks.forEach((c, i) => { c.embedding = vectors[i]; });
  }
}

module.exports = RagFileIngestor;
