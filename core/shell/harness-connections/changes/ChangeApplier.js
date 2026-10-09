const LedgerEntry = require('./LedgerEntry');

class ChangeApplier {
  static apply({ plan, workingSet, connector, previous = null }) {
    const earlier = previous ? previous.ledger : [];
    const settings = plan.settings();
    const applied = settings
      .map((setting) => ChangeApplier._applySetting(setting, workingSet, connector, previous))
      .filter(Boolean);
    const untouched = earlier.filter((entry) => !settings.some((s) => LedgerEntry.sameTarget(entry, s)));
    return [...applied, ...untouched];
  }

  static _applySetting(setting, workingSet, connector, previous) {
    const document = workingSet.open(setting.file, setting.format);
    const found = document.readPath(setting.path);
    const earlier = ChangeApplier._earlierEntry(setting, found, document, connector, previous);
    if (setting.seedOnly && found.present) return earlier;
    const entry = earlier ? LedgerEntry.renewed(earlier, setting.value) : LedgerEntry.record(setting, found, document.data());
    document.set(setting.path, setting.value);
    return entry;
  }

  static _earlierEntry(setting, found, document, connector, previous) {
    if (!previous) return null;
    const entry = previous.ledger.find((e) => LedgerEntry.sameTarget(e, setting));
    return entry && connector.owns(entry, found, document.data(), previous.endpoints) ? entry : null;
  }
}

module.exports = ChangeApplier;
