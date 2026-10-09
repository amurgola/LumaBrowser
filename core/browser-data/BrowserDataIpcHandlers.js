const { ipcMain, nativeTheme, app } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const BrowserDataPreferences = require('./BrowserDataPreferences');
const FaviconLookup = require('./FaviconLookup');
const BookmarkChangeNotifier = require('./BookmarkChangeNotifier');

class BrowserDataIpcHandlers {
  constructor({ historyService, bookmarkService, db, getMainWindow, faviconCache } = {}) {
    this._history = historyService;
    this._bookmarks = bookmarkService;
    this._preferences = new BrowserDataPreferences({ db, nativeTheme });
    this._favicons = new FaviconLookup(faviconCache);
    this._notifier = new BookmarkChangeNotifier(getMainWindow);
  }

  register() {
    this._registerHistory();
    this._registerBookmarks();
    this._registerPreferences();
    this._registerFavicons();
    this._applyDarkModeWhenReady();
  }

  _registerHistory() {
    const h = this._history;
    this._handle('history:suggest', (_e, query, opts) => h.suggest(query, opts || {}));
    this._handle('history:list', (_e, opts) => h.list(opts || {}));
    this._handle('history:delete', (_e, id) => h.deleteEntry(id));
    this._handle('history:delete-url', (_e, url) => h.deleteUrl(url));
    this._handle('history:clear', (_e, opts) => h.clear(opts || {}));
  }

  _registerBookmarks() {
    const b = this._bookmarks;
    this._handle('bookmarks:get-tree', () => b.getTree());
    this._handle('bookmarks:is-bookmarked', (_e, url) => b.isBookmarked(url));
    this._handleMutation('bookmarks:add', (_e, payload) => b.addBookmark(payload || {}));
    this._handleMutation('bookmarks:add-folder', (_e, payload) => b.addFolder(payload || {}));
    this._handleMutation('bookmarks:update', (_e, id, patch) => b.update(id, patch || {}));
    this._handleMutation('bookmarks:move', (_e, id, parentId, position) => b.move(id, parentId, position));
    this._handleMutation('bookmarks:remove', (_e, id) => b.remove(id));
    this._handleMutation('bookmarks:toggle-url', (_e, url, title) => b.toggleUrl(url, title));
  }

  _registerPreferences() {
    const p = this._preferences;
    this._handle('settings:get-start-page', () => p.getStartPage());
    this._handle('settings:set-start-page', (_e, url) => p.setStartPage(url));
    this._handle('settings:get-search-engine', () => p.getSearchEngine());
    this._handle('settings:set-search-engine', (_e, id) => p.setSearchEngine(id));
    this._handle('settings:list-search-engines', () => p.listSearchEngines());
    this._handle('settings:search-url', (_e, query) => p.searchUrl(query));
    this._handle('settings:get-dark-mode', () => p.getDarkMode());
    this._handle('settings:set-dark-mode', (_e, enabled) => p.setDarkMode(enabled));
  }

  _registerFavicons() {
    this._handle('browser-data:get-favicon', (_e, host) => this._favicons.get(host));
    this._handle('browser-data:get-favicons', (_e, hosts) => this._favicons.getMany(hosts));
  }

  _applyDarkModeWhenReady() {
    app.whenReady().then(() => this._preferences.applyStoredDarkMode());
  }

  _handleMutation(channel, fn) {
    this._handle(channel, (...args) => this._notifier.afterMutation(() => fn(...args)));
  }

  _handle(channel, fn) {
    ipcMain.handle(channel, IpcEnvelope.raw(fn));
  }
}

module.exports = BrowserDataIpcHandlers;
