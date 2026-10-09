class StoreHandle {
  static requireOpen(settingsDb, label) {
    if (!settingsDb || !settingsDb.db) {
      throw new Error(`${label} requires a SettingsDatabase with an open handle`);
    }
    return settingsDb.db;
  }
}

module.exports = StoreHandle;
