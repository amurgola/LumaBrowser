const crypto = require('crypto');
const OsKeychain = require('../shared/OsKeychain');
const FileMutationQueue = require('../shell/FileMutationQueue');
const VaultSites = require('./VaultSites');
const AutofillFields = require('./AutofillFields');

class VaultStore {
  static DATA_KEY = 'core.vault.data';
  static VERSION = 1;
  static TYPES = ['login', 'profile', 'key'];
  static FIELDS = {
    login: ['origin', 'username', 'password', 'title', 'notes', 'totp'],
    profile: ['title', ...AutofillFields.KEYS],
    key: ['title', 'value', 'notes'],
  };

  static slug(title) {
    return String(title || '').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  constructor(db, { cipher = new OsKeychain(), now = () => Date.now(), log = console } = {}) {
    this._db = db;
    this._cipher = cipher;
    this._now = now;
    this._log = log;
    this._items = null;
    this._unreadable = false;
    this._writes = new FileMutationQueue();
  }

  async open() {
    await this._cipher.ready();
    if (this._load()) return this.status();
    const { text, stale } = await this._cipher.open(this._db.get(VaultStore.DATA_KEY, null));
    this._adopt(text);
    if (stale && !this._unreadable) this._save(this._items);
    return this.status();
  }

  idle() {
    return this._writes.run(VaultStore.DATA_KEY, () => {});
  }

  status() {
    const items = this._current();
    return { encrypted: this._cipher.available(), unreadable: this._unreadable, count: items.length };
  }

  all() {
    return this._current().map((item) => ({ ...item })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  get(id) {
    const item = this._current().find((i) => i.id === id);
    return item ? { ...item } : null;
  }

  loginsFor(url) {
    const out = [];
    for (const item of this._current()) {
      if (item.type !== 'login') continue;
      const match = VaultSites.match(item.origin, url);
      if (match) out.push({ ...item, match });
    }
    const rank = (i) => (i.match === 'exact' ? 0 : 1);
    return out.sort((a, b) => rank(a) - rank(b) || (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  }

  findLogin(origin, username) {
    const item = this._current().find((i) => i.type === 'login' && i.origin === origin && (i.username || '') === (username || ''));
    return item ? { ...item } : null;
  }

  add(fields) {
    const item = VaultStore._clean({ ...fields, id: crypto.randomUUID(), createdAt: this._now(), updatedAt: this._now(), timesUsed: 0 });
    this._mutate((items) => items.push(item));
    return { ...item };
  }

  update(id, patch) {
    let updated = null;
    this._mutate((items) => {
      const at = items.findIndex((i) => i.id === id);
      if (at < 0) return;
      const { id: _ignored, createdAt, ...rest } = patch || {};
      updated = VaultStore._clean({ ...items[at], ...rest, id, updatedAt: this._now() });
      items[at] = updated;
    });
    return updated ? { ...updated } : null;
  }

  remove(id) {
    let removed = false;
    this._mutate((items) => {
      const at = items.findIndex((i) => i.id === id);
      if (at >= 0) { items.splice(at, 1); removed = true; }
    });
    return removed;
  }

  recordUse(id) {
    this._mutate((items) => {
      const item = items.find((i) => i.id === id);
      if (item) { item.lastUsedAt = this._now(); item.timesUsed = (item.timesUsed || 0) + 1; }
    });
  }

  addMany(list) {
    const now = this._now();
    const items = list.map((fields) => VaultStore._clean({ ...fields, id: crypto.randomUUID(), createdAt: now, updatedAt: now, timesUsed: 0 }));
    this._mutate((all) => all.push(...items));
    return items.length;
  }

  static _clean(item) {
    const text = (v) => (v == null ? '' : String(v));
    const type = VaultStore.TYPES.includes(item.type) ? item.type : 'login';
    const fields = {};
    for (const key of VaultStore.FIELDS[type]) fields[key] = text(item[key]);
    if (type === 'login') fields.origin = VaultSites.normalizeOrigin(item.origin) || '';
    return {
      id: item.id,
      type,
      ...fields,
      aiAccess: item.aiAccess === true,
      createdAt: Number(item.createdAt) || 0,
      updatedAt: Number(item.updatedAt) || 0,
      lastUsedAt: Number(item.lastUsedAt) || 0,
      timesUsed: Number(item.timesUsed) || 0,
    };
  }

  _mutate(change) {
    if (!this._load()) throw new Error('The saved passwords are still being opened. Try again in a moment.');
    if (this._unreadable) throw new Error('The saved passwords cannot be opened on this account, so nothing can be changed.');
    const next = this._items.map((i) => ({ ...i }));
    change(next);
    this._items = next;
    this._save(next);
  }

  _save(items) {
    const text = JSON.stringify({ v: VaultStore.VERSION, items });
    this._writes.run(VaultStore.DATA_KEY, async () => {
      const sealed = await this._cipher.seal(text);
      this._db.set(VaultStore.DATA_KEY, { v: VaultStore.VERSION, ...sealed });
    }).catch((err) => this._log.error('[vault] a change to the saved passwords could not be stored:', err && err.message));
  }

  _current() {
    return this._load() ? this._items : [];
  }

  _load() {
    if (this._items) return true;
    const record = this._db ? this._db.get(VaultStore.DATA_KEY, null) : null;
    if (!record) { this._items = []; return true; }
    if (typeof record.plain !== 'string') return false;
    this._adopt(record.plain);
    return true;
  }

  _adopt(text) {
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (_) { parsed = null; }
    if (!parsed || !Array.isArray(parsed.items)) {
      this._items = [];
      this._unreadable = true;
      return;
    }
    this._items = parsed.items.filter((i) => i && i.id).map((i) => VaultStore._clean(i));
  }
}

module.exports = VaultStore;
