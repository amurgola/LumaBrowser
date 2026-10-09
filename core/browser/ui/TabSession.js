export default class TabSession {
  static HISTORY_CAP = 50;

  static BLANK = 'about:blank';

  constructor({ id, webview, tabElement, url = TabSession.BLANK, title = 'New Tab', silent = false }) {
    this.id = id;
    this.webview = webview;
    this.tabElement = tabElement;
    this.silent = !!silent;
    this.url = url;
    this.title = title;
    this.loading = false;
    this.zoomLevel = 1.0;
    this.createdAt = Date.now();
    this.lastNavigatedAt = null;
    this.history = [];
    this.historyIndex = -1;
    if (url && url !== TabSession.BLANK) this._pushHistory(url);
  }

  onNavigate(url) {
    this.url = url;
    this.lastNavigatedAt = Date.now();
    this.loading = false;
    this._pushHistory(url);
  }

  onTitleUpdate(title) {
    this.title = title;
    if (this.history.length > 0) this.history[this.history.length - 1].title = title;
  }

  onLoadStart() {
    this.loading = true;
  }

  onLoadFinish() {
    this.loading = false;
  }

  getHistory() {
    return this.history.map((h) => ({ url: h.url, title: h.title, visitedAt: h.visitedAt }));
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      title: this.title,
      loading: this.loading,
      createdAt: this.createdAt,
      lastNavigatedAt: this.lastNavigatedAt,
      historyLength: this.history.length,
      silent: this.silent,
      active: false,
    };
  }

  toDetailedJSON() {
    return { ...this.toJSON(), history: this.getHistory() };
  }

  _pushHistory(url) {
    const last = this.history.length > 0 ? this.history[this.history.length - 1] : null;
    if (last && last.url === url) return;
    this.history.push({ url, title: this.title, visitedAt: Date.now() });
    if (this.history.length > TabSession.HISTORY_CAP) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }
}
