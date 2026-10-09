const BookmarkStore = require('./BookmarkStore');

class BookmarkService {
  static DEFAULT_FOLDER_TITLE = 'New folder';

  constructor(settingsDb) {
    this._store = new BookmarkStore(settingsDb);
  }

  getTree() {
    return this._store.tree();
  }

  getChildren(parentId = null) {
    return this._store.children(parentId);
  }

  addBookmark({ url, title, parentId = null, openOnStartup = false } = {}) {
    const clean = BookmarkService._requireUrl(url);
    return this._store.create({
      type: 'bookmark',
      url: clean,
      title: BookmarkService._trimmedTitle(title) || clean,
      parentId: parentId || null,
      openOnStartup: !!openOnStartup,
    });
  }

  addFolder({ title, parentId = null } = {}) {
    return this._store.create({
      type: 'folder',
      title: BookmarkService._trimmedTitle(title) || BookmarkService.DEFAULT_FOLDER_TITLE,
      parentId: parentId || null,
    });
  }

  update(id, patch = {}) {
    if (!id) throw new Error('Bookmark id is required');
    return this._store.update(id, patch);
  }

  move(id, parentId, position) {
    return this._store.update(id, { parentId: parentId || null, position });
  }

  toggleStartup(id, openOnStartup) {
    return this._store.update(id, { openOnStartup: !!openOnStartup });
  }

  remove(id) {
    return this._store.remove(id);
  }

  isBookmarked(url) {
    const clean = BookmarkService._trimmedUrl(url);
    return clean ? this._store.isBookmarked(clean) : false;
  }

  toggleUrl(url, title) {
    const clean = BookmarkService._trimmedUrl(url);
    if (!clean) return { bookmarked: false };
    const existing = this._store.findByUrl(clean);
    if (existing) return this._unbookmark(existing);
    return { bookmarked: true, bookmark: this.addBookmark({ url: clean, title }) };
  }

  getStartupBookmarks() {
    return this._store.startupBookmarks();
  }

  _unbookmark(existing) {
    this._store.remove(existing.id);
    return { bookmarked: false };
  }

  static _requireUrl(url) {
    const clean = BookmarkService._trimmedUrl(url);
    if (!clean) throw new Error('Bookmark url is required');
    return clean;
  }

  static _trimmedUrl(url) {
    return (url || '').trim();
  }

  static _trimmedTitle(title) {
    return title ? String(title).trim() : '';
  }
}

module.exports = BookmarkService;
