const ConfigValue = require('../documents/ConfigValue');
const KeyPath = require('../documents/KeyPath');

class LedgerEntry {
  static ABSENT = Object.freeze({ present: false });

  static record(setting, found, data) {
    return {
      file: setting.file,
      format: setting.format.ID,
      path: [...setting.path],
      wrote: ConfigValue.plain(setting.value),
      prior: LedgerEntry.prior(found),
      created: found.present ? null : KeyPath.firstMissing(data, setting.path),
    };
  }

  static renewed(entry, value) {
    return { ...entry, wrote: ConfigValue.plain(value) };
  }

  static inferred(setting, prior = LedgerEntry.ABSENT) {
    return {
      file: setting.file,
      format: setting.format.ID,
      path: [...setting.path],
      wrote: setting.seedOnly ? undefined : ConfigValue.plain(setting.value),
      prior,
      created: null,
    };
  }

  static prior(found) {
    return found.present ? { present: true, value: ConfigValue.plain(found.value) } : LedgerEntry.ABSENT;
  }

  static sameTarget(a, b) {
    return a.file === b.file && KeyPath.equals(a.path, b.path);
  }

  static describe(entry) {
    return { file: entry.file, path: KeyPath.label(entry.path) };
  }
}

module.exports = LedgerEntry;
