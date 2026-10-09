class SitePermissionStore {
  static SITES_KEY = 'core.permissions.sites';

  constructor(db) {
    this._db = db || null;
  }

  answerFor(origin, kind) {
    const row = this._sites()[origin];
    return (row && row[kind]) || null;
  }

  remember(origin, kinds, value) {
    if (!this._db) return;
    const sites = { ...this._sites() };
    const row = { ...(sites[origin] || {}) };
    for (const k of kinds) row[k] = value;
    sites[origin] = row;
    this._db.set(SitePermissionStore.SITES_KEY, sites);
  }

  list() {
    const sites = this._sites();
    return Object.keys(sites).sort().map((origin) => ({
      origin,
      camera: sites[origin].camera || null,
      microphone: sites[origin].microphone || null,
    }));
  }

  clear(origin) {
    if (!this._db) return false;
    const sites = { ...this._sites() };
    if (!(origin in sites)) return false;
    delete sites[origin];
    this._db.set(SitePermissionStore.SITES_KEY, sites);
    return true;
  }

  clearAll() {
    if (this._db) this._db.set(SitePermissionStore.SITES_KEY, {});
  }

  _sites() {
    if (!this._db) return {};
    const value = this._db.get(SitePermissionStore.SITES_KEY, {});
    return value && typeof value === 'object' ? value : {};
  }
}

module.exports = SitePermissionStore;
