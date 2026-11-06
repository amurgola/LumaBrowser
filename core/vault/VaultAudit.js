class VaultAudit {
  static KEY = 'core.vault.audit';
  static MAX = 200;

  constructor(db, { now = () => Date.now(), mirror = null } = {}) {
    this._db = db;
    this._now = now;
    this._mirror = mirror;
  }

  setMirror(mirror) {
    this._mirror = typeof mirror === 'function' ? mirror : null;
  }

  record(entry) {
    const row = {
      at: this._now(),
      action: String(entry.action || ''),
      item: entry.item ? { kind: entry.item.kind || '', name: String(entry.item.name || '') } : null,
      site: String(entry.site || ''),
      caller: String(entry.caller || ''),
      ok: !!entry.ok,
      reason: String(entry.reason || '').slice(0, 200),
    };
    try {
      const list = this.list();
      list.unshift(row);
      this._db.set(VaultAudit.KEY, list.slice(0, VaultAudit.MAX));
    } catch (_) {}
    if (this._mirror) { try { this._mirror(row, entry); } catch (_) {} }
    return row;
  }

  list() {
    const v = this._db.get(VaultAudit.KEY, []);
    return Array.isArray(v) ? v.slice() : [];
  }

  clear() {
    this._db.set(VaultAudit.KEY, []);
    return { success: true };
  }
}

module.exports = VaultAudit;
