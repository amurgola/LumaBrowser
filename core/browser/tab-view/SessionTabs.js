const SessionTabList = require('./SessionTabList');

class SessionTabs {
  static ENABLED_KEY = 'core.app.restoreTabs';
  static SAVE_DELAY_MS = 500;
  static EVENTS = ['tabCreated', 'tabClosed', 'tabHidden', 'tabMoved', 'tabSwitched', 'tabNavigated', 'tabTitleUpdated'];

  constructor({ db, registry, emitter, setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout }) {
    this._db = db;
    this._list = db ? new SessionTabList(db) : null;
    this._registry = registry;
    this._setTimeout = setTimeoutFn;
    this._clearTimeout = clearTimeoutFn;
    this._timer = null;
    this._sealed = false;
    if (emitter) for (const event of SessionTabs.EVENTS) emitter.on(event, () => this.schedule());
  }

  isEnabled() {
    if (!this._db) return false;
    try { return !!this._db.get(SessionTabs.ENABLED_KEY, false); } catch (_) { return false; }
  }

  saved() {
    if (!this._list || !this.isEnabled()) return null;
    const session = this._list.read();
    return session.tabs.length > 0 ? session : null;
  }

  schedule() {
    if (this._sealed || this._timer || !this.isEnabled()) return;
    this._timer = this._setTimeout(() => {
      this._timer = null;
      this.save();
    }, SessionTabs.SAVE_DELAY_MS);
  }

  save() {
    if (this._sealed || !this._list) return;
    try {
      this._list.write(this.isEnabled() ? this._snapshot() : { tabs: [], activeIndex: -1 });
    } catch (err) {
      console.warn('[TabViewManager] failed to save session tabs:', err && err.message);
    }
  }

  seal() {
    if (this._sealed) return;
    if (this._timer) this._clearTimeout(this._timer);
    this._timer = null;
    this.save();
    this._sealed = true;
  }

  _snapshot() {
    const entries = this._registry.inStrip().filter((entry) => entry.isRegularBrowsing() && !entry.keepAlive && entry.url);
    return {
      tabs: entries.map((entry) => ({ url: entry.url, title: entry.title })),
      activeIndex: entries.findIndex((entry) => this._registry.isActive(entry.id)),
    };
  }
}

module.exports = SessionTabs;
