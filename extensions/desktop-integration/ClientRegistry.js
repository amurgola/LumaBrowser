class ClientRegistry {
  static HEADER = 'x-luma-client';
  static ANONYMOUS = 'unknown';
  static MAX_CLIENTS = 100;
  static MAX_NAME = 80;

  constructor({ now = () => new Date(), onChange = () => {} } = {}) {
    this._now = now;
    this._onChange = onChange;
    this._clients = new Map();
  }

  static parse(header) {
    const raw = String(header || '').trim().slice(0, ClientRegistry.MAX_NAME);
    if (!raw) return { name: ClientRegistry.ANONYMOUS, version: null };
    const slash = raw.indexOf('/');
    if (slash < 0) return { name: raw, version: null };
    return { name: raw.slice(0, slash).trim() || ClientRegistry.ANONYMOUS, version: raw.slice(slash + 1).trim() || null };
  }

  record(headers, feature = null) {
    const { name, version } = ClientRegistry.parse((headers || {})[ClientRegistry.HEADER]);
    const entry = this._clients.get(name) || this._create(name);
    entry.version = version || entry.version;
    entry.lastSeen = this._now().toISOString();
    entry.requests += 1;
    if (feature) entry.features[feature] = (entry.features[feature] || 0) + 1;
    this._onChange(entry);
    return entry;
  }

  list() {
    return [...this._clients.values()]
      .map((entry) => ({ ...entry, features: { ...entry.features } }))
      .sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));
  }

  clear() {
    this._clients.clear();
  }

  _create(name) {
    if (this._clients.size >= ClientRegistry.MAX_CLIENTS) this._evictOldest();
    const entry = { name, version: null, firstSeen: this._now().toISOString(), lastSeen: null, requests: 0, features: {} };
    this._clients.set(name, entry);
    return entry;
  }

  _evictOldest() {
    const oldest = this.list().pop();
    if (oldest) this._clients.delete(oldest.name);
  }
}

module.exports = ClientRegistry;
