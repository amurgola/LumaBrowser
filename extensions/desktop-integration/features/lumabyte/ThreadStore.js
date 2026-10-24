const fs = require('fs');
const path = require('path');

class ThreadStore {
  static VERSION = 1;
  static MAX_MESSAGES = 60;
  static MAX_THREADS = 50;
  static WRITE_DELAY_MS = 400;

  constructor({ file, fsImpl = fs, now = Date.now, setTimeout: st = setTimeout, clearTimeout: ct = clearTimeout }) {
    this._file = file;
    this._fs = fsImpl;
    this._now = now;
    this._st = st;
    this._ct = ct;
    this._data = null;
    this._timer = null;
  }

  static keyFor(app) {
    return String((app && (app.exe || app.className)) || 'unknown').toLowerCase();
  }

  messages(key) {
    const t = this._load().threads[key];
    return t ? t.messages.map((m) => ({ ...m })) : [];
  }

  append(key, message, label = '') {
    const data = this._load();
    const t = data.threads[key] || { label, messages: [] };
    t.label = label || t.label;
    t.messages.push({ role: message.role, content: String(message.content || ''), at: this._now() });
    if (t.messages.length > ThreadStore.MAX_MESSAGES) t.messages = t.messages.slice(-ThreadStore.MAX_MESSAGES);
    t.updated = this._now();
    data.threads[key] = t;
    this._trim(data);
    this._schedule();
  }

  clear(key) {
    const data = this._load();
    const t = data.threads[key];
    if (!t) return false;
    delete data.threads[key];
    if (t.messages && t.messages.length) data.previous[key] = t;
    this._trim(data);
    this._schedule();
    return true;
  }

  previous(key) {
    const t = this._load().previous[key];
    return t && t.messages && t.messages.length ? { count: t.messages.length, updated: t.updated || 0 } : null;
  }

  resume(key) {
    const data = this._load();
    const prev = data.previous[key];
    if (!prev) return false;
    const cur = data.threads[key];
    data.threads[key] = prev;
    if (cur && cur.messages && cur.messages.length) data.previous[key] = cur;
    else delete data.previous[key];
    this._schedule();
    return true;
  }

  flush() {
    if (this._timer) this._ct(this._timer);
    this._timer = null;
    if (!this._data) return;
    try {
      this._fs.mkdirSync(path.dirname(this._file), { recursive: true });
      const tmp = `${this._file}.tmp`;
      this._fs.writeFileSync(tmp, JSON.stringify(this._data));
      this._fs.renameSync(tmp, this._file);
    } catch (_) {}
  }

  _schedule() {
    if (this._timer) this._ct(this._timer);
    this._timer = this._st(() => this.flush(), ThreadStore.WRITE_DELAY_MS);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  _trim(data) {
    for (const group of [data.threads, data.previous]) {
      const keys = Object.keys(group);
      if (keys.length <= ThreadStore.MAX_THREADS) continue;
      keys.sort((a, b) => (group[a].updated || 0) - (group[b].updated || 0));
      for (const k of keys.slice(0, keys.length - ThreadStore.MAX_THREADS)) delete group[k];
    }
  }

  _load() {
    if (this._data) return this._data;
    let data = null;
    try { data = JSON.parse(this._fs.readFileSync(this._file, 'utf8')); } catch (_) { data = null; }
    this._data = data && data.version === ThreadStore.VERSION && data.threads && typeof data.threads === 'object'
      ? data
      : { version: ThreadStore.VERSION, threads: {} };
    if (!this._data.previous || typeof this._data.previous !== 'object') this._data.previous = {};
    return this._data;
  }
}

module.exports = ThreadStore;
