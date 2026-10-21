const fs = require('fs');
const path = require('path');
const ChromeApiShim = require('./ChromeApiShim');

class WorkerRegistrations {
  static FILE = 'luma-extension-workers.json';

  constructor({ currentHash = () => ChromeApiShim.shimHash(), log = console } = {}) {
    this._currentHash = currentHash;
    this._log = log;
  }

  async prepare(sess, extId) {
    if (!extId || !sess || typeof sess.clearStorageData !== 'function') return false;
    const record = this._read(sess);
    if (record && record[extId] === this._currentHash()) return false;
    try {
      await sess.clearStorageData({ origin: `chrome-extension://${extId}`, storages: ['serviceworkers'] });
      return true;
    } catch (err) {
      this._log.warn(`[chrome-ext] could not reset the worker of ${extId}:`, err && err.message);
      return false;
    }
  }

  record(sess, extId) {
    const file = WorkerRegistrations._fileOf(sess);
    if (!extId || !file) return;
    const record = this._read(sess) || {};
    if (record[extId] === this._currentHash()) return;
    record[extId] = this._currentHash();
    try {
      fs.writeFileSync(file, JSON.stringify(record, null, 2));
    } catch (err) {
      this._log.warn('[chrome-ext] could not save worker registrations:', err && err.message);
    }
  }

  _read(sess) {
    const file = WorkerRegistrations._fileOf(sess);
    if (!file) return null;
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (_) {
      return null;
    }
  }

  static _fileOf(sess) {
    const dir = sess && sess.storagePath;
    return typeof dir === 'string' && dir ? path.join(dir, WorkerRegistrations.FILE) : null;
  }
}

module.exports = WorkerRegistrations;
