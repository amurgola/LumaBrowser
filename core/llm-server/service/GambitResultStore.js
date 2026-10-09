const ModelResultStore = require('./ModelResultStore');

class GambitResultStore extends ModelResultStore {
  static STORAGE_KEY = 'core.llmServer.gambitResults';

  constructor(settingsDb) {
    super(settingsDb, GambitResultStore.STORAGE_KEY);
  }

  _isWorthKeeping(entry) {
    const report = entry && entry.report;
    return !!report && !!report.coverage && report.coverage.ran !== 0;
  }

  _toRecord(entry) {
    const { raw, ...summary } = entry.report;
    return {
      report: summary,
      ranAt: ModelResultStore._ranAt(entry),
      canceled: !!entry.canceled,
    };
  }
}

module.exports = GambitResultStore;
