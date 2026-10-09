const crypto = require('crypto');

class TabShareList {
  static KEY = 'shares';
  static TOKEN_RE = /^[a-f0-9]{32}$/;
  static MODES = new Set(['view', 'interact']);

  constructor({ db = null, log } = {}) {
    this._db = db;
    this._log = log || (() => {});
    this._shares = [];
  }

  static isMode(mode) {
    return TabShareList.MODES.has(mode);
  }

  static isToken(token) {
    return TabShareList.TOKEN_RE.test(token);
  }

  static create(entry, mode) {
    return {
      id: `ts_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
      token: crypto.randomBytes(16).toString('hex'),
      tabId: entry.id,
      partition: entry.partition || null,
      url: entry.url || '',
      title: entry.title || '',
      mode,
      createdAt: Date.now(),
      persistedBefore: !!entry.keepAlive,
    };
  }

  all() {
    return this._shares;
  }

  byTab(tabId) {
    return this._shares.find((s) => s.tabId === tabId) || null;
  }

  byId(id) {
    return this._shares.find((s) => s.id === id) || null;
  }

  byToken(token) {
    return this._shares.find((s) => s.token === token) || null;
  }

  dormantIn(partition) {
    return this._shares.filter((s) => s.tabId == null && s.partition && s.partition === partition);
  }

  add(share) {
    this._shares.push(share);
    this.save();
  }

  remove(id) {
    const before = this._shares.length;
    this._shares = this._shares.filter((s) => s.id !== id);
    if (this._shares.length !== before) this.save();
  }

  load() {
    const raw = this._db ? this._db.get(TabShareList.KEY, []) : [];
    this._shares = (Array.isArray(raw) ? raw : [])
      .filter((s) => s && typeof s.token === 'string' && TabShareList.isToken(s.token) && TabShareList.isMode(s.mode))
      .map((s) => ({ ...s, tabId: null }));
  }

  save() {
    if (!this._db) return;
    try { this._db.set(TabShareList.KEY, this._shares.map((s) => ({ ...s }))); } catch (err) { this._log(`save failed: ${err && err.message}`); }
  }
}

module.exports = TabShareList;
