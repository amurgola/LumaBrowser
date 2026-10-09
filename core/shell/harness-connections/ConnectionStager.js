const ChangeApplier = require('./changes/ChangeApplier');
const ChangeReverter = require('./changes/ChangeReverter');
const WorkingSet = require('./changes/WorkingSet');
const ConfigFormats = require('./documents/ConfigFormats');

class ConnectionStager {
  constructor({ paths, manifest, backups, getEndpoints, getModel, now }) {
    this._paths = paths;
    this._manifest = manifest;
    this._backups = backups;
    this._getEndpoints = getEndpoints;
    this._getModel = getModel;
    this._now = now;
  }

  stageConnect(connector) {
    const entry = this._manifest.entry(connector.id);
    const previous = entry ? this._recorded(connector, entry) : null;
    const endpoints = this._getEndpoints();
    const model = this._getModel() || null;
    const workingSet = new WorkingSet();
    const plan = connector.plan({ paths: this._paths, endpoints, model, now: this._now() });
    const ledger = ChangeApplier.apply({ plan, workingSet, connector, previous });
    return { workingSet, ledger, endpoints, model, previousFiles: previous ? previous.files : {} };
  }

  stageDisconnect(connector) {
    const recorded = this._recorded(connector, this._manifest.entry(connector.id));
    const workingSet = new WorkingSet();
    const restored = this._restoreExactly(workingSet, recorded.files);
    const ledger = recorded.ledger.filter((e) => !restored.includes(e.file));
    const kept = ChangeReverter.revert({ ledger, workingSet, connector, endpoints: recorded.endpoints });
    this._deleteEmptiedFiles(workingSet, recorded, restored);
    return { workingSet, kept, restored };
  }

  drift(connector, entry) {
    const recorded = this._recorded(connector, entry);
    return ChangeReverter.drift({ ledger: recorded.ledger, workingSet: new WorkingSet(), connector, endpoints: recorded.endpoints });
  }

  _recorded(connector, entry) {
    const endpoints = (entry && entry.endpoints) || this._getEndpoints();
    if (entry && Array.isArray(entry.ledger)) return { ledger: entry.ledger, endpoints, files: entry.files || {} };
    const model = (entry && entry.model) || null;
    const plan = connector.plan({ paths: this._paths, endpoints, model, now: this._now() });
    const priors = entry && entry.restore ? connector.legacyPriors(entry.restore, this._paths) : [];
    return { ledger: ChangeReverter.inferLedger(plan, priors), endpoints, files: {} };
  }

  _restoreExactly(workingSet, files) {
    const restored = [];
    for (const [file, record] of Object.entries(files)) {
      const original = this._backups.original(record, workingSet.original(file));
      if (original === undefined) continue;
      workingSet.replace(file, original);
      restored.push(file);
    }
    return restored;
  }

  _deleteEmptiedFiles(workingSet, recorded, restored) {
    for (const [file, record] of Object.entries(recorded.files)) {
      const entry = recorded.ledger.find((e) => e.file === file);
      if (record.existed || restored.includes(file) || !entry) continue;
      const document = workingSet.open(file, ConfigFormats.byId(entry.format));
      if (document.isBlank()) workingSet.replace(file, null);
    }
  }
}

module.exports = ConnectionStager;
