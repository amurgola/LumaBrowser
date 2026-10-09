const fs = require('fs');
const path = require('path');
const StoreHandle = require('../../database/StoreHandle');
const RecordId = require('../../database/RecordId');
const ArtifactContent = require('./artifacts/ArtifactContent');
const ArtifactDocument = require('./artifacts/ArtifactDocument');

class ArtifactStore {
  static ID_PREFIX = 'art';
  static DEFAULT_TITLE = 'Artifact';

  static LIST_SQL = `
    SELECT a.id, a.conversation_id, a.message_id, a.title, a.type, a.language,
           COALESCE(a.root_id, a.id) AS root_id, a.version, a.created_at, g.cnt AS version_count
    FROM llm_artifacts a
    JOIN (
      SELECT COALESCE(root_id, id) AS rid, MAX(version) AS maxv, COUNT(*) AS cnt,
             MIN(created_at) AS firstc, MIN(rowid) AS firstrow
      FROM llm_artifacts WHERE conversation_id = ? GROUP BY COALESCE(root_id, id)
    ) g ON COALESCE(a.root_id, a.id) = g.rid AND a.version = g.maxv
    WHERE a.conversation_id = ?
    ORDER BY g.firstc ASC, g.firstrow ASC`;

  static LIVE_ROOTS_SQL = `
    SELECT a.id, a.conversation_id, a.title, a.type, a.language,
           COALESCE(a.root_id, a.id) AS root_id, a.version, a.created_at, g.cnt AS version_count
    FROM llm_artifacts a
    JOIN (
      SELECT COALESCE(root_id, id) AS rid, MAX(version) AS maxv, COUNT(*) AS cnt,
             MIN(created_at) AS firstc, MIN(rowid) AS firstrow
      FROM llm_artifacts WHERE type = 'live' GROUP BY COALESCE(root_id, id)
    ) g ON COALESCE(a.root_id, a.id) = g.rid AND a.version = g.maxv
    WHERE a.type = 'live'
    ORDER BY g.firstc DESC, g.firstrow DESC
    LIMIT ?`;

  static ALL_ROOTS_SQL = `
    SELECT a.id, a.conversation_id, a.message_id, a.title, a.type, a.language,
           COALESCE(a.root_id, a.id) AS root_id, a.version, a.created_at,
           g.cnt AS version_count, g.bytes AS chain_bytes, c.title AS conversation_title
    FROM llm_artifacts a
    JOIN (
      SELECT COALESCE(root_id, id) AS rid, MAX(version) AS maxv, COUNT(*) AS cnt, SUM(LENGTH(content)) AS bytes,
             MIN(created_at) AS firstc, MIN(rowid) AS firstrow
      FROM llm_artifacts GROUP BY COALESCE(root_id, id)
    ) g ON COALESCE(a.root_id, a.id) = g.rid AND a.version = g.maxv
    LEFT JOIN llm_conversations c ON c.id = a.conversation_id
    ORDER BY g.firstc DESC, g.firstrow DESC
    LIMIT ?`;

  constructor({ settingsDb, artifactsDir, getWebBase } = {}) {
    this._db = StoreHandle.requireOpen(settingsDb, 'ArtifactStore');
    if (!artifactsDir) throw new Error('ArtifactStore requires an artifactsDir');
    this.dir = artifactsDir;
    this._getWebBase = typeof getWebBase === 'function' ? getWebBase : () => null;
    try { fs.mkdirSync(this.dir, { recursive: true }); } catch (_) {}
    this._prepareStatements();
  }

  static newId() {
    return RecordId.create(ArtifactStore.ID_PREFIX);
  }

  create({ conversationId = null, messageId = null, title, type, language, content, bytes, mime } = {}) {
    const kind = ArtifactContent.typeOf(type);
    const { storedContent, storedLanguage } = ArtifactContent.normalize(kind, { content, bytes, mime, language });
    const id = ArtifactStore.newId();
    return this._persist({
      id,
      conversation_id: conversationId || null,
      message_id: messageId || null,
      title: ArtifactStore._cleanTitle(title) || ArtifactStore.DEFAULT_TITLE,
      type: kind,
      language: storedLanguage,
      content: storedContent,
      root_id: id,
      version: 1,
      created_at: new Date().toISOString(),
    });
  }

  createVersion({ sourceId, conversationId, messageId = null, title, language, content, bytes, mime } = {}) {
    const source = sourceId ? this._get.get(sourceId) : null;
    if (!source) throw new Error(`createVersion: source artifact "${sourceId}" not found`);
    const rootId = source.root_id || source.id;
    const { storedContent, storedLanguage } = ArtifactContent.normalize(source.type, {
      content, bytes, mime, language: language != null ? language : source.language,
    });
    return this._persist({
      id: ArtifactStore.newId(),
      conversation_id: (conversationId != null ? conversationId : source.conversation_id) || null,
      message_id: messageId || null,
      title: ArtifactStore._cleanTitle(title) || source.title,
      type: source.type,
      language: storedLanguage,
      content: storedContent,
      root_id: rootId,
      version: (this._maxVersion.get(rootId).m || source.version || 1) + 1,
      created_at: new Date().toISOString(),
    });
  }

  get(id) {
    const row = this._get.get(id);
    return row ? this._hydrate(row) : null;
  }

  renderedHtml(id, opts) {
    const row = this._get.get(id);
    return row ? ArtifactDocument.render(row, opts || {}, this._getWebBase()) : null;
  }

  list(conversationId) {
    if (!conversationId) return [];
    return this._list.all(conversationId, conversationId).map((r) => ({
      ...this._chainSummary(r),
      messageId: r.message_id,
      language: r.language,
      url: this.urlFor(r.id),
    }));
  }

  listLiveRoots({ limit = 200 } = {}) {
    return this._listLiveRoots.all(limit).map((r) => this._chainSummary(r));
  }

  listAllRoots({ limit = 500 } = {}) {
    return this._listAllRoots.all(limit).map((r) => ({
      ...this._chainSummary(r),
      messageId: r.message_id,
      language: r.language,
      bytes: r.chain_bytes || 0,
      conversationTitle: r.conversation_title || null,
      orphaned: !r.conversation_id || r.conversation_title == null,
      url: this.urlFor(r.id),
    }));
  }

  rootIdFor(idOrRootId) {
    if (!idOrRootId) return null;
    const row = this._get.get(idOrRootId);
    return row ? (row.root_id || row.id) : idOrRootId;
  }

  versions(idOrRootId) {
    const rootId = this.rootIdFor(idOrRootId);
    if (!rootId) return [];
    return this._versionsByRoot.all(rootId).map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      messageId: r.message_id,
      title: r.title,
      type: r.type,
      language: r.language,
      version: r.version,
      createdAt: r.created_at,
      url: this.urlFor(r.id),
    }));
  }

  delete(id) {
    if (!id || !this._get.get(id)) return false;
    this._removeVersion(id);
    return true;
  }

  deleteRoot(idOrRootId) {
    const rootId = this.rootIdFor(idOrRootId);
    if (!rootId) return 0;
    const ids = this._idsByRoot.all(rootId).map((r) => r.id);
    ids.forEach((id) => this._removeVersion(id));
    return ids.length;
  }

  reparent(idOrRootId, { conversationId = null, messageId = null } = {}) {
    const rootId = this.rootIdFor(idOrRootId);
    if (!rootId) return 0;
    const info = this._reparent.run({ conversation_id: conversationId || null, message_id: messageId || null, root_id: rootId });
    return info.changes || 0;
  }

  ensureFile(id) {
    const row = this._get.get(id);
    if (!row) return null;
    const filePath = this._filePath(id);
    if (!fs.existsSync(filePath)) this._write(row);
    return filePath;
  }

  urlFor(id) {
    const base = this._getWebBase();
    if (base) return `${String(base).replace(/\/+$/, '')}/artifacts/${id}.html`;
    return 'file://' + this._filePath(id).replace(/\\/g, '/');
  }

  _persist(row) {
    this._insert.run(row);
    const filePath = this._write(row);
    return { id: row.id, title: row.title, type: row.type, language: row.language, rootId: row.root_id, version: row.version, url: this.urlFor(row.id), filePath };
  }

  _write(row) {
    const filePath = this._filePath(row.id);
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      fs.writeFileSync(filePath, ArtifactDocument.render(row, {}, this._getWebBase()));
    } catch (err) {
      throw new Error(`Failed to write artifact file: ${err.message}`);
    }
    return filePath;
  }

  _removeVersion(id) {
    this._delete.run(id);
    try { fs.unlinkSync(this._filePath(id)); } catch (_) {}
  }

  _filePath(id) {
    return path.join(this.dir, `${id}.html`);
  }

  _chainSummary(r) {
    return {
      id: r.id,
      conversationId: r.conversation_id,
      title: r.title,
      type: r.type,
      rootId: r.root_id,
      version: r.version,
      versionCount: r.version_count,
      createdAt: r.created_at,
    };
  }

  _hydrate(r) {
    return {
      id: r.id,
      conversationId: r.conversation_id,
      messageId: r.message_id,
      title: r.title,
      type: r.type,
      language: r.language,
      content: r.content,
      rootId: r.root_id || r.id,
      version: r.version,
      createdAt: r.created_at,
      url: this.urlFor(r.id),
    };
  }

  static _cleanTitle(title) {
    return title ? String(title).trim() : '';
  }

  _prepareStatements() {
    this._insert = this._db.prepare(`
      INSERT INTO llm_artifacts (id, conversation_id, message_id, title, type, language, content, root_id, version, created_at)
      VALUES (@id, @conversation_id, @message_id, @title, @type, @language, @content, @root_id, @version, @created_at)
    `);
    this._get = this._db.prepare('SELECT * FROM llm_artifacts WHERE id = ?');
    this._list = this._db.prepare(ArtifactStore.LIST_SQL);
    this._listLiveRoots = this._db.prepare(ArtifactStore.LIVE_ROOTS_SQL);
    this._listAllRoots = this._db.prepare(ArtifactStore.ALL_ROOTS_SQL);
    this._versionsByRoot = this._db.prepare(`
      SELECT id, conversation_id, message_id, title, type, language, version, created_at
      FROM llm_artifacts WHERE COALESCE(root_id, id) = ? ORDER BY version ASC, rowid ASC
    `);
    this._maxVersion = this._db.prepare('SELECT MAX(version) AS m FROM llm_artifacts WHERE COALESCE(root_id, id) = ?');
    this._idsByRoot = this._db.prepare('SELECT id FROM llm_artifacts WHERE COALESCE(root_id, id) = ?');
    this._delete = this._db.prepare('DELETE FROM llm_artifacts WHERE id = ?');
    this._reparent = this._db.prepare(`
      UPDATE llm_artifacts SET conversation_id = @conversation_id, message_id = @message_id
      WHERE COALESCE(root_id, id) = @root_id
    `);
  }
}

module.exports = ArtifactStore;
