export default class SearchEngineChoice {
  static DEFAULT = 'duckduckgo';

  static ENGINES = {
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
    google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
    brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=%s' },
    startpage: { name: 'Startpage', url: 'https://www.startpage.com/do/search?q=%s' },
  };

  constructor() {
    this.id = SearchEngineChoice.DEFAULT;
  }

  static isKnown(id) {
    return !!(id && SearchEngineChoice.ENGINES[id]);
  }

  select(id) {
    if (!SearchEngineChoice.isKnown(id)) return false;
    this.id = id;
    return true;
  }

  name() {
    return this._engine().name;
  }

  searchUrl(query) {
    return this._engine().url.replace('%s', encodeURIComponent(query));
  }

  placeholder() {
    return `Search ${this.name()} or enter address`;
  }

  _engine() {
    return SearchEngineChoice.ENGINES[this.id] || SearchEngineChoice.ENGINES[SearchEngineChoice.DEFAULT];
  }
}
