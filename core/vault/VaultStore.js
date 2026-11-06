const crypto = require('crypto');
const VaultCipher = require('./VaultCipher');
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

  constructor(db, { cipher = new VaultCipher(), now = () => Date.now() } = {}) {
    this._db = db;
    this._cipher = cipher;
    this._now = now;
    this._items = null;
    this._unreadable = false;
  }

  status() {
    this._load();
    return { encrypted: this._cipher.available(), unreadable: this._unreadable, count: this._items.length };
  }

  all() {
    this._load();
    return this._items.map((item) => ({ ...item })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  get(id) {
    this._load();
    const item = this._items.find((i) => i.id === id);
    return item ? { ...item } : null;
  }

  loginsFor(url) {
    this._load();
    const out = [];
    for (const item of this._items) {
      if (item.type !== 'login') continue;
      const match = VaultSites.match(item.origin, url);
      if (match) out.push({ ...item, match });
    }
    const rank = (i) => (i.match === 'exact' ? 0 : 1);
    return out.sort((a, b) => rank(a) - rank(b) || (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  }

  findLogin(origin, username) {
    this._load();
    const item = this._items.find((i) => i.type === 'login' && i.origin === origin && (i.username || '') === (username || ''));
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
    this._load();
    if (this._unreadable) throw new Error('The saved passwords cannot be opened on this account, so nothing can be changed.');
    const next = this._items.map((i) => ({ ...i }));
    change(next);
    this._write(next);
    this._items = next;
  }

  _write(items) {
    const sealed = this._cipher.seal(JSON.stringify({ v: VaultStore.VERSION, items }));
    this._db.set(VaultStore.DATA_KEY, { v: VaultStore.VERSION, ...sealed });
  }

  _load() {
    if (this._items) return;
    const record = this._db ? this._db.get(VaultStore.DATA_KEY, null) : null;
    if (!record) { this._items = []; return; }
    const text = this._cipher.open(record);
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
