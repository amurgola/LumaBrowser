class SearchEngines {
  static ENGINES = [
    { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', home: 'https://duckduckgo.com' },
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s', home: 'https://www.google.com' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s', home: 'https://www.bing.com' },
    { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com/search?q=%s', home: 'https://search.brave.com' },
    { id: 'startpage', name: 'Startpage', url: 'https://www.startpage.com/do/search?q=%s', home: 'https://www.startpage.com' },
  ];

  static DEFAULT_ID = 'duckduckgo';
  static SETTINGS_KEY = 'searchEngine';

  static byId(id) {
    return SearchEngines._find(id) || SearchEngines._find(SearchEngines.DEFAULT_ID);
  }

  static urlFor(id, query) {
    const engine = SearchEngines.byId(id);
    return engine.url.replace('%s', encodeURIComponent(String(query || '').trim()));
  }

  static currentId(db) {
    try {
      return SearchEngines.byId(SearchEngines._storedId(db)).id;
    } catch (_) {
      return SearchEngines.DEFAULT_ID;
    }
  }

  static _find(id) {
    return SearchEngines.ENGINES.find((engine) => engine.id === id);
  }

  static _storedId(db) {
    if (!db || typeof db.get !== 'function') return SearchEngines.DEFAULT_ID;
    return db.get(SearchEngines.SETTINGS_KEY, SearchEngines.DEFAULT_ID);
  }
}

module.exports = SearchEngines;
