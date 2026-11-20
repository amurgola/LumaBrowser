const HiddenTab = require('./HiddenTab');

class SlackSidebar {
  static ROW = '.p-channel_sidebar__static_list__item[id]';
  static READY = '.p-channel_sidebar__static_list__item .p-channel_sidebar__channel';
  static ROWS_JS = `(() => [...document.querySelectorAll('${SlackSidebar.ROW}')].map((row) => {
  const name = row.querySelector('.p-channel_sidebar__name');
  const own = name && name.firstElementChild;
  return { id: row.id, name: ((own || name || {}).textContent || '').trim() };
}))()`;
  static CONVERSATION_ID = /^[CDG][A-Z0-9]{6,}$/;
  static TEAM = /\/client\/([A-Z0-9]+)/;
  static KNOWN_KEY = 'slack.conversations';

  constructor({ tabs, browser = null, db = null }) {
    this._tabs = tabs;
    this._browser = browser;
    this._db = db;
  }

  async addressOf(tab, name) {
    const team = (String((tab && tab.url) || '').match(SlackSidebar.TEAM) || [])[1];
    if (!team || !name) return null;
    const id = this._known(team, name)
      || this._learn(team, await this._rowsOf(tab), name)
      || this._learn(team, await this._rowsInHiddenTab(team, tab.partition), name);
    return id ? SlackSidebar._address(team, id) : null;
  }

  static find(rows, name) {
    const wanted = SlackSidebar._key(name);
    const row = wanted ? SlackSidebar._conversations(rows).find((r) => SlackSidebar._key(r.name) === wanted) : null;
    return row ? row.id : null;
  }

  async _rowsOf(tab) {
    try { return await this._tabs.run(tab.tabId, SlackSidebar.ROWS_JS); } catch (_) { return []; }
  }

  async _rowsInHiddenTab(team, partition) {
    if (!this._browser || typeof this._browser.createTab !== 'function') return [];
    const rows = await HiddenTab.use(this._browser, { url: SlackSidebar._address(team, ''), partition, ready: SlackSidebar.READY }, (tabId) => this._tabs.run(tabId, SlackSidebar.ROWS_JS));
    return rows || [];
  }

  _learn(team, rows, name) {
    const listed = SlackSidebar._conversations(rows);
    if (listed.length && this._db) {
      const known = this._db.get(SlackSidebar.KNOWN_KEY, {}) || {};
      known[team] = { ...(known[team] || {}), ...Object.fromEntries(listed.map((r) => [SlackSidebar._key(r.name), r.id])) };
      this._db.set(SlackSidebar.KNOWN_KEY, known);
    }
    return SlackSidebar.find(listed, name);
  }

  _known(team, name) {
    const known = this._db ? this._db.get(SlackSidebar.KNOWN_KEY, {}) || {} : {};
    return (known[team] || {})[SlackSidebar._key(name)] || null;
  }

  static _conversations(rows) {
    return (Array.isArray(rows) ? rows : []).filter((r) => r && SlackSidebar.CONVERSATION_ID.test(String(r.id)) && SlackSidebar._key(r.name));
  }

  static _address(team, id) {
    return `https://app.slack.com/client/${team}${id ? `/${id}` : ''}`;
  }

  static _key(name) {
    return String(name || '').trim().toLowerCase().replace(/^#/, '');
  }
}

module.exports = SlackSidebar;
