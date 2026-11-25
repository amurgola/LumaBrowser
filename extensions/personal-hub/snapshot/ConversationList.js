const HiddenTab = require('./HiddenTab');

class ConversationList {
  constructor({ tabs, browser = null, db = null }) {
    this._tabs = tabs;
    this._browser = browser;
    this._db = db;
  }

  async addressOf(tab, name) {
    const app = this.constructor;
    const space = app.spaceOf(tab);
    if (space === null || !name) return null;
    const id = this._known(space, name)
      || this._learn(space, await this._rowsOf(tab), name)
      || this._learn(space, await this._rowsInHiddenTab(space, tab.partition), name);
    return id ? app.address(space, id) : null;
  }

  static find(rows, name) {
    const wanted = this.key(name);
    const row = wanted ? this.conversations(rows).find((r) => this.key(r.name) === wanted) : null;
    return row ? row.id : null;
  }

  static conversations(rows) {
    return (Array.isArray(rows) ? rows : []).filter((r) => r && this.CONVERSATION_ID.test(String(r.id)) && this.key(r.name));
  }

  static key(name) {
    return String(name || '').trim().toLowerCase().replace(/^#/, '');
  }

  async _rowsOf(tab) {
    try { return await this._tabs.run(tab.tabId, this.constructor.ROWS_JS); } catch (_) { return []; }
  }

  async _rowsInHiddenTab(space, partition) {
    if (!this._browser || typeof this._browser.createTab !== 'function') return [];
    const app = this.constructor;
    const rows = await HiddenTab.use(this._browser, { url: app.home(space), partition, ready: app.READY }, (tabId) => this._tabs.run(tabId, app.SCAN_JS || app.ROWS_JS));
    return rows || [];
  }

  _learn(space, rows, name) {
    const app = this.constructor;
    const listed = app.conversations(rows);
    if (listed.length && this._db) {
      const known = this._db.get(app.KNOWN_KEY, {}) || {};
      known[space] = { ...(known[space] || {}), ...Object.fromEntries(listed.map((r) => [app.key(r.name), r.id])) };
      this._db.set(app.KNOWN_KEY, known);
    }
    return app.find(listed, name);
  }

  _known(space, name) {
    const app = this.constructor;
    const known = this._db ? this._db.get(app.KNOWN_KEY, {}) || {} : {};
    return (known[space] || {})[app.key(name)] || null;
  }
}

module.exports = ConversationList;
