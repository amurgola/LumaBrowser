class SitePermissionStore {
  static SITES_KEY = 'core.permissions.sites';
  static KINDS = ['camera', 'microphone', 'popups', 'notifications'];

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
    return Object.keys(sites).sort().map((origin) => {
      const row = { origin };
      for (const kind of SitePermissionStore.KINDS) row[kind] = sites[origin][kind] || null;
      return row;
    });
  }

  forget(origin, kind) {
    if (!this._db) return false;
    const sites = { ...this._sites() };
    if (!sites[origin] || !(kind in sites[origin])) return false;
    const row = { ...sites[origin] };
    delete row[kind];
    if (Object.keys(row).length) sites[origin] = row; else delete sites[origin];
    this._db.set(SitePermissionStore.SITES_KEY, sites);
    return true;
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
