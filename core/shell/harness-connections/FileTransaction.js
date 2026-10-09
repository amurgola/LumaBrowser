const ConfigFile = require('./ConfigFile');

class FileTransaction {
  static run(work) {
    const tx = new FileTransaction();
    try {
      return work(tx);
    } catch (err) {
      throw tx._rollBack(err);
    }
  }

  constructor() {
    this._journal = [];
  }

  write(file, text) {
    if (!this._journalBefore(file, text)) return;
    ConfigFile.writeAtomic(file, text);
  }

  remove(file) {
    if (!this._journalBefore(file, null)) return;
    ConfigFile.remove(file);
  }

  _journalBefore(file, next) {
    const before = ConfigFile.readTextOr(file, null);
    if (before === next) return false;
    this._journal.push({ file, before });
    return true;
  }

  _rollBack(err) {
    const failures = [];
    for (const { file, before } of [...this._journal].reverse()) {
      try {
        if (before === null) ConfigFile.remove(file);
        else ConfigFile.writeAtomic(file, before);
      } catch (e) {
        failures.push(`${file}: ${(e && e.message) || e}`);
      }
    }
    const message = (err && err.message) || String(err);
    return new Error(failures.length ? `${message} (and restoring failed: ${failures.join('; ')})` : message);
  }
}

module.exports = FileTransaction;
