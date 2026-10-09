const crypto = require('crypto');
const path = require('path');
const ConfigFile = require('./ConfigFile');

class ConfigBackups {
  static SUFFIX = '.orig';

  constructor(dir) {
    this._dir = dir;
  }

  record(harness, changes, previous = {}) {
    const records = { ...previous };
    for (const change of changes) {
      const earlier = previous[change.file];
      records[change.file] = earlier ? ConfigBackups._advance(earlier, change) : this._begin(harness, change);
    }
    return records;
  }

  original(record, currentText) {
    if (!record || !record.exact) return undefined;
    if (ConfigBackups.fingerprint(currentText) !== record.writtenHash) return undefined;
    if (!record.existed) return null;
    return ConfigFile.readTextOr(record.backup, undefined);
  }

  static fingerprint(text) {
    return text === null ? null : crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  }

  _begin(harness, { file, before, after }) {
    return {
      existed: before !== null,
      backup: before === null ? null : this._save(harness, file, before),
      exact: true,
      writtenHash: ConfigBackups.fingerprint(after),
    };
  }

  static _advance(earlier, { before, after }) {
    return {
      ...earlier,
      exact: earlier.exact && ConfigBackups.fingerprint(before) === earlier.writtenHash,
      writtenHash: ConfigBackups.fingerprint(after),
    };
  }

  _save(harness, file, text) {
    const target = path.join(this._dir, harness, ConfigBackups._fileName(file));
    ConfigFile.writeAtomic(target, text);
    return target;
  }

  static _fileName(file) {
    return file.replace(/[^A-Za-z0-9.-]+/g, '_').replace(/^_+/, '') + ConfigBackups.SUFFIX;
  }
}

module.exports = ConfigBackups;
