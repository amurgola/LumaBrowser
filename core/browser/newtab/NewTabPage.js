const path = require('path');
const { pathToFileURL } = require('url');
const SearchEngines = require('../SearchEngines');

class NewTabPage {
  static SCHEME = 'luma';
  static HOST = 'newtab';
  static URL = 'luma://newtab/';
  static MODE_KEY = 'core.newtab.mode';
  static MODES = ['newtab', 'start'];
  static HIDDEN_KEY = 'core.newtab.hidden';
  static START_PAGE_KEY = 'startPageUrl';
  static DEFAULT_START_PAGE = 'https://duckduckgo.com';
  static DIR = path.join(__dirname, '..', '..', '..', 'ui', 'newtab');
  static FILES = { '/': 'newtab.html', '/newtab.html': 'newtab.html', '/newtab.css': 'newtab.css', '/newtab.js': 'newtab.js' };
  static MAX_SITES = 8;

  static _sessions = new WeakSet();

  static privilegedScheme() {
    return { scheme: NewTabPage.SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } };
  }

  static isNewTab(url) {
    return /^luma:\/\/newtab(\/|$)/i.test(String(url || ''));
  }

  static resolve(db) {
    let mode = 'newtab';
    let start = NewTabPage.DEFAULT_START_PAGE;
    try {
      mode = db ? db.get(NewTabPage.MODE_KEY, 'newtab') : 'newtab';
      start = (db && db.get(NewTabPage.START_PAGE_KEY, NewTabPage.DEFAULT_START_PAGE)) || NewTabPage.DEFAULT_START_PAGE;
    } catch (_) {}
    return mode === 'start' ? String(start).trim() || NewTabPage.DEFAULT_START_PAGE : NewTabPage.URL;
  }

  static attach(sess, fetchFile) {
    if (!sess || !sess.protocol || NewTabPage._sessions.has(sess)) return;
    NewTabPage._sessions.add(sess);
    try {
      sess.protocol.handle(NewTabPage.SCHEME, (request) => NewTabPage.serve(request.url, fetchFile));
    } catch (_) {}
  }

  static serve(url, fetchFile) {
    let u;
    try { u = new URL(url); } catch (_) { return new Response('Not found', { status: 404 }); }
    const file = u.hostname === NewTabPage.HOST ? NewTabPage.FILES[u.pathname] : null;
    if (!file) return new Response('Not found', { status: 404 });
    return fetchFile(pathToFileURL(path.join(NewTabPage.DIR, file)).href);
  }

  constructor({ db, history, favicons = null }) {
    this._db = db;
    this._history = history;
    this._favicons = favicons;
  }

  mode() {
    const m = this._db.get(NewTabPage.MODE_KEY, 'newtab');
    return NewTabPage.MODES.includes(m) ? m : 'newtab';
  }

  setMode(mode) {
    const m = NewTabPage.MODES.includes(mode) ? mode : 'newtab';
    this._db.set(NewTabPage.MODE_KEY, m);
    return m;
  }

  url() {
    return NewTabPage.resolve(this._db);
  }

  data() {
    const engine = SearchEngines.byId(SearchEngines.currentId(this._db));
    let sites = [];
    try { sites = this._history.topSites({ limit: NewTabPage.MAX_SITES, hiddenHosts: this.hidden() }); } catch (_) { sites = []; }
    return {
      engine: { name: engine.name },
      sites: sites.map((s) => ({ url: s.url, title: s.title || s.host, host: s.host, icon: this._iconFor(s.url) })),
    };
  }

  searchUrl(query) {
    const q = String(query || '').trim();
    return q ? SearchEngines.urlFor(SearchEngines.currentId(this._db), q) : null;
  }

  hidden() {
    const list = this._db.get(NewTabPage.HIDDEN_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  hide(url) {
    let host;
    try { host = new URL(String(url)).hostname.replace(/^www\./, ''); } catch (_) { return { success: false }; }
    this._db.set(NewTabPage.HIDDEN_KEY, [...new Set([...this.hidden(), host])]);
    return { success: true };
  }

  resetHidden() {
    this._db.set(NewTabPage.HIDDEN_KEY, []);
    return { success: true };
  }

  _iconFor(url) {
    try { return (this._favicons && this._favicons.getForUrl(url)) || null; } catch (_) { return null; }
  }
}

module.exports = NewTabPage;
