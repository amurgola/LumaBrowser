class NonPersistingDb {
  static wrap(db) {
    return {
      get: (key, fallback) => db.get(key, fallback),
      has: (key) => NonPersistingDb._has(db, key),
      set: () => {},
      delete: () => {},
    };
  }

  static _has(db, key) {
    if (typeof db.has === 'function') return db.has(key);
    return db.get(key, undefined) !== undefined;
  }
}

module.exports = NonPersistingDb;
