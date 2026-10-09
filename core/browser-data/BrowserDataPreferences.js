const SearchEngines = require('../browser/SearchEngines');

class BrowserDataPreferences {
  static DEFAULT_START_PAGE = 'https://duckduckgo.com';
  static DEFAULT_DARK_MODE = true;
  static START_PAGE_KEY = 'startPageUrl';
  static DARK_MODE_KEY = 'darkMode';

  constructor({ db, nativeTheme } = {}) {
    this._db = db;
    this._nativeTheme = nativeTheme;
  }

  getStartPage() {
    return this._db.get(BrowserDataPreferences.START_PAGE_KEY, BrowserDataPreferences.DEFAULT_START_PAGE);
  }

  setStartPage(url) {
    const clean = String(url || '').trim() || BrowserDataPreferences.DEFAULT_START_PAGE;
    this._db.set(BrowserDataPreferences.START_PAGE_KEY, clean);
    return clean;
  }

  getSearchEngine() {
    return SearchEngines.currentId(this._db);
  }

  setSearchEngine(id) {
    const clean = SearchEngines.byId(id).id;
    this._db.set(SearchEngines.SETTINGS_KEY, clean);
    return clean;
  }

  listSearchEngines() {
    return SearchEngines.ENGINES.map((engine) => ({ ...engine }));
  }

  searchUrl(query) {
    return SearchEngines.urlFor(this.getSearchEngine(), query);
  }

  getDarkMode() {
    return this._db.get(BrowserDataPreferences.DARK_MODE_KEY, BrowserDataPreferences.DEFAULT_DARK_MODE);
  }

  setDarkMode(enabled) {
    const on = !!enabled;
    this._db.set(BrowserDataPreferences.DARK_MODE_KEY, on);
    this._applyDarkMode(on);
    return on;
  }

  applyStoredDarkMode() {
    this._applyDarkMode(this.getDarkMode());
  }

  _applyDarkMode(enabled) {
    try {
      this._nativeTheme.themeSource = enabled ? 'dark' : 'light';
    } catch (_) {
    }
  }
}

module.exports = BrowserDataPreferences;
