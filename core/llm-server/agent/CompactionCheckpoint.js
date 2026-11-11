const crypto = require('crypto');

class CompactionCheckpoint {
  static VERSION = 1;

  constructor(store = null, { window = null } = {}) {
    this._store = store && typeof store.load === 'function' && typeof store.save === 'function' ? store : null;
    this._window = Number(window) > 0 ? Math.floor(Number(window)) : 0;
    this._lead = 0;
    this._original = null;
    this._standing = null;
    this._aligned = false;
  }

  get enabled() {
    return !!this._store;
  }

  begin(messages) {
    if (!this._store || !Array.isArray(messages)) return;
    let lead = 0;
    while (lead < messages.length && messages[lead] && messages[lead].role === 'system') lead += 1;
    this._lead = lead;
    this._original = messages.slice(lead);
    this._standing = null;
    this._aligned = true;
  }

  apply(messages, { needed = false } = {}) {
    if (!this._aligned || this._standing) return 0;
    const entry = CompactionCheckpoint._valid(this._load());
    if (!entry || entry.count >= this._original.length) return 0;
    if (!needed && !(this._window > 0 && entry.window >= this._window)) return 0;
    if (CompactionCheckpoint.digest(this._original.slice(0, entry.count)) !== entry.digest) return 0;
    messages.splice(this._lead, entry.count, { role: 'user', content: entry.content });
    this._standing = entry;
    return entry.count;
  }

  record(result) {
    if (!this._aligned) return false;
    const entry = this._entryFor(result);
    if (!entry) {
      this._aligned = false;
      return false;
    }
    this._standing = entry;
    try { this._store.save(entry); } catch (_) {}
    return true;
  }

  _entryFor(result) {
    if (!result || !result.compacted || !Array.isArray(result.messages)) return null;
    if (result.prefixLength !== this._lead + 1) return null;
    const summarized = result.keptFrom - this._lead;
    const count = this._standing ? this._standing.count + summarized - 1 : summarized;
    if (!(count > 0) || count >= this._original.length) return null;
    const framed = result.messages[this._lead];
    if (!framed || typeof framed.content !== 'string' || !framed.content) return null;
    return {
      v: CompactionCheckpoint.VERSION,
      count,
      digest: CompactionCheckpoint.digest(this._original.slice(0, count)),
      content: framed.content,
      window: this._window,
    };
  }

  _load() {
    try { return this._store.load(); } catch (_) { return null; }
  }

  static _valid(entry) {
    if (!entry || typeof entry !== 'object' || entry.v !== CompactionCheckpoint.VERSION) return null;
    if (!Number.isInteger(entry.count) || entry.count <= 0) return null;
    if (typeof entry.digest !== 'string' || typeof entry.content !== 'string' || !entry.content) return null;
    return entry;
  }

  static digest(messages) {
    const hash = crypto.createHash('sha1');
    for (const m of messages || []) {
      const content = m && typeof m.content === 'string' ? m.content : JSON.stringify((m && m.content) || '');
      hash.update(String((m && m.role) || ''));
      hash.update('\u0000');
      hash.update(content);
      hash.update('\u0001');
    }
    return hash.digest('hex');
  }
}

module.exports = CompactionCheckpoint;
