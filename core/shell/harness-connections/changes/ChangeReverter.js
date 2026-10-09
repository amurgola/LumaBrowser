const ConfigFormats = require('../documents/ConfigFormats');
const ConfigValue = require('../documents/ConfigValue');
const LedgerEntry = require('./LedgerEntry');

class ChangeReverter {
  static assess({ ledger, workingSet, connector, endpoints }) {
    return ledger.map((entry) => {
      const document = workingSet.open(entry.file, ConfigFormats.byId(entry.format));
      const found = document.readPath(entry.path);
      return { entry, found, ours: connector.owns(entry, found, document.data(), endpoints) };
    });
  }

  static drift(args) {
    return ChangeReverter.assess(args)
      .filter((verdict) => !verdict.ours)
      .map((verdict) => ({ ...LedgerEntry.describe(verdict.entry), removed: !verdict.found.present }));
  }

  static revert(args) {
    const verdicts = ChangeReverter.assess(args);
    for (const verdict of [...verdicts].reverse()) {
      if (verdict.ours) ChangeReverter._undo(verdict.entry, args.workingSet);
    }
    return verdicts.filter((v) => !v.ours && v.found.present).map((v) => LedgerEntry.describe(v.entry));
  }

  static inferLedger(plan, priors = []) {
    return plan.settings().map((setting) => {
      const known = priors.find((p) => LedgerEntry.sameTarget(p, setting));
      return LedgerEntry.inferred(setting, known ? known.prior : undefined);
    });
  }

  static _undo(entry, workingSet) {
    const document = workingSet.open(entry.file, ConfigFormats.byId(entry.format));
    if (entry.prior.present) {
      document.set(entry.path, entry.prior.value);
      return;
    }
    document.remove(entry.path);
    ChangeReverter._pruneEmptyParents(document, entry.path, entry.created);
  }

  static _pruneEmptyParents(document, path, created) {
    const floor = created ? created.length : 1;
    for (let depth = path.length - 1; depth >= floor; depth -= 1) {
      const parent = path.slice(0, depth);
      const found = document.readPath(parent);
      if (!found.present || !ConfigValue.isEmptyTable(found.value)) return;
      document.remove(parent);
    }
  }
}

module.exports = ChangeReverter;
