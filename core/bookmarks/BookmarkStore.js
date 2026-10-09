const StoreHandle = require('../database/StoreHandle');
const RecordId = require('../database/RecordId');

class BookmarkStore {
  static ORDER = 'ORDER BY position ASC, created_at ASC, rowid ASC';

  constructor(settingsDb) {
    this._db = StoreHandle.requireOpen(settingsDb, 'BookmarkStore');
    this._prepareStatements();
  }

  create({ id, type = 'bookmark', title, url, parentId = null, position, openOnStartup = false } = {}) {
    const row = this._newRow({ id, type, title, url, parentId: parentId ?? null, position, openOnStartup });
    this._insert.run(row);
    return this.getById(row.id);
  }

  getById(id) {
    const row = this._getById.get(id);
    return row ? BookmarkStore._hydrate(row) : null;
  }

  children(parentId = null) {
    return this._childrenOf.all(parentId ?? null).map(BookmarkStore._hydrate);
  }

  all() {
    return this._all.all().map(BookmarkStore._hydrate);
  }

  tree() {
    const byParent = this._groupByParent(this.all());
    return this._attachChildren(byParent, null);
  }

  findByUrl(url) {
    const row = this._findByUrl.get(url);
    return row ? BookmarkStore._hydrate(row) : null;
  }

  isBookmarked(url) {
    return !!this._findByUrl.get(url);
  }

  update(id, patch = {}) {
    const existing = this._getById.get(id);
    if (!existing) return null;
    const assignments = this._assignmentsFor(existing, patch);
    if (assignments.length === 0) return BookmarkStore._hydrate(existing);
    this._runUpdate(id, assignments);
    return this.getById(id);
  }

  remove(id) {
    if (!this._getById.get(id)) return 0;
    return this._db.transaction((rootId) => this._deleteSubtree(rootId))(id);
  }

  startupBookmarks() {
    return this._startup.all().map(BookmarkStore._hydrate);
  }

  _prepareStatements() {
    this._insert = this._db.prepare(`
      INSERT INTO bookmarks (id, parent_id, type, title, url, position, open_on_startup, created_at)
      VALUES (@id, @parent_id, @type, @title, @url, @position, @open_on_startup, @created_at)
    `);
    this._getById = this._db.prepare('SELECT * FROM bookmarks WHERE id = ?');
    this._all = this._db.prepare(`SELECT * FROM bookmarks ${BookmarkStore.ORDER}`);
    this._childrenOf = this._db.prepare(`SELECT * FROM bookmarks WHERE parent_id IS ? ${BookmarkStore.ORDER}`);
    this._maxPositionIn = this._db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM bookmarks WHERE parent_id IS ?');
    this._findByUrl = this._db.prepare("SELECT * FROM bookmarks WHERE type = 'bookmark' AND url = ? LIMIT 1");
    this._delete = this._db.prepare('DELETE FROM bookmarks WHERE id = ?');
    this._startup = this._db.prepare(
      "SELECT * FROM bookmarks WHERE type = 'bookmark' AND open_on_startup = 1 ORDER BY position ASC, created_at ASC"
    );
  }

  _newRow({ id, type, title, url, parentId, position, openOnStartup }) {
    return {
      id: id || BookmarkStore._newId(type),
      parent_id: parentId,
      type,
      title: title != null ? title : null,
      url: type === 'folder' ? null : (url || null),
      position: position != null ? position : this._nextPosition(parentId),
      open_on_startup: openOnStartup ? 1 : 0,
      created_at: new Date().toISOString(),
    };
  }

  _nextPosition(parentId) {
    return this._maxPositionIn.get(parentId ?? null).m + 1;
  }

  _groupByParent(nodes) {
    const byParent = new Map();
    for (const node of nodes) {
      const key = node.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(node);
    }
    return byParent;
  }

  _attachChildren(byParent, parentId) {
    return (byParent.get(parentId ?? null) || []).map((node) => {
      if (node.type === 'folder') node.children = this._attachChildren(byParent, node.id);
      return node;
    });
  }

  _assignmentsFor(existing, patch) {
    const assignments = [];
    const set = (column, value) => assignments.push([column, value]);
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.url !== undefined && existing.type !== 'folder') set('url', patch.url || null);
    if (patch.openOnStartup !== undefined) set('open_on_startup', patch.openOnStartup ? 1 : 0);
    this._placementAssignments(patch, set);
    return assignments;
  }

  _placementAssignments(patch, set) {
    if (patch.parentId !== undefined) {
      const newParent = patch.parentId ?? null;
      set('parent_id', newParent);
      set('position', patch.position !== undefined ? patch.position : this._nextPosition(newParent));
    } else if (patch.position !== undefined) {
      set('position', patch.position);
    }
  }

  _runUpdate(id, assignments) {
    const columns = assignments.map(([column]) => `${column} = ?`).join(', ');
    const values = assignments.map(([, value]) => value);
    this._db.prepare(`UPDATE bookmarks SET ${columns} WHERE id = ?`).run(...values, id);
  }

  _deleteSubtree(id) {
    let count = 0;
    for (const child of this._childrenOf.all(id)) count += this._deleteSubtree(child.id);
    return count + this._delete.run(id).changes;
  }

  static _newId(type) {
    return RecordId.create(type === 'folder' ? 'bmf' : 'bm');
  }

  static _hydrate(row) {
    return {
      id: row.id,
      parentId: row.parent_id,
      type: row.type,
      title: row.title,
      url: row.url,
      position: row.position,
      openOnStartup: !!row.open_on_startup,
      createdAt: row.created_at,
    };
  }
}

module.exports = BookmarkStore;
