const ModelResultStore = require('./ModelResultStore');

class FitResultStore extends ModelResultStore {
  static STORAGE_KEY = 'core.llmServer.fitResults';

  constructor(settingsDb) {
    super(settingsDb, FitResultStore.STORAGE_KEY);
  }

  _isWorthKeeping(entry) {
    return !!entry && Array.isArray(entry.results) && entry.results.length > 0;
  }

  _toRecord(entry) {
    return {
      runtime: entry.runtime || null,
      results: entry.results,
      hardware: entry.hardware || null,
      ranAt: ModelResultStore._ranAt(entry),
      canceled: !!entry.canceled,
    };
  }
}

module.exports = FitResultStore;
