const ModelRuntimeMatch = require('../server/launcher/ModelRuntimeMatch');
const RuntimeFrameworks = require('./RuntimeFrameworks');

class ModelRuntimeResolver {
  static WHY = Object.freeze({
    ONLY: 'only', PIN: 'pin', CLAIM: 'claim', FORMAT_DEFAULT: 'format-default', PREVIOUS: 'previous', FIRST: 'first',
  });

  constructor({ model, rows, selection, legacyRuntimeId = null, order = [], usable = ModelRuntimeResolver.isInstalled }) {
    this._model = model;
    this._rows = Array.isArray(rows) ? rows : [];
    this._selection = selection;
    this._legacyRuntimeId = legacyRuntimeId;
    this._order = Array.isArray(order) ? order : [];
    this._usable = usable;
  }

  static resolve(options) {
    return new ModelRuntimeResolver(options).execute();
  }

  static isInstalled(row) {
    return !!(row && row.installed && row.binaryPath);
  }

  execute() {
    const format = RuntimeFrameworks.formatOfModel(this._model);
    const loaders = this._loaders(format);
    if (loaders.length === 0) return { unloadable: format };
    const usable = loaders.filter((row) => this._usable(row));
    if (usable.length === 0) return this._missing(loaders, format);
    const choice = this._choose(usable, format);
    return { runtime: choice.row, frameworkId: choice.frameworkId, why: choice.why };
  }

  _loaders(format) {
    if (!format) return [];
    return this._rows.filter((row) => RuntimeFrameworks.loads(row, format) && !ModelRuntimeMatch.refusal(this._model, row));
  }

  _missing(loaders, format) {
    const choice = this._choose(loaders, format);
    return { missing: choice.row, frameworkId: choice.frameworkId };
  }

  _choose(pool, format) {
    const byFramework = ModelRuntimeResolver._byFramework(pool);
    const { frameworkId, why } = this._chooseFramework(byFramework, pool, format);
    return { frameworkId, why, row: this._chooseBuild(frameworkId, byFramework.get(frameworkId)) };
  }

  _chooseFramework(byFramework, pool, format) {
    const WHY = ModelRuntimeResolver.WHY;
    const first = byFramework.keys().next().value;
    if (byFramework.size === 1) return { frameworkId: first, why: WHY.ONLY };
    const candidates = [
      [this._selection.modelFramework(this._modelPath()), WHY.PIN],
      [this._claimingFramework(pool), WHY.CLAIM],
      [this._selection.formatFramework(format), WHY.FORMAT_DEFAULT],
      [this._frameworkOf(pool, this._legacyRuntimeId), WHY.PREVIOUS],
    ];
    const hit = candidates.find(([frameworkId]) => frameworkId && byFramework.has(frameworkId));
    return hit ? { frameworkId: hit[0], why: hit[1] } : { frameworkId: first, why: WHY.FIRST };
  }

  _chooseBuild(frameworkId, builds) {
    return ModelRuntimeResolver.pickBuild(builds, [
      this._selection.activeBuild(frameworkId), this._legacyRuntimeId, ...this._preferredIds(), ...this._order,
    ]);
  }

  static pickBuild(builds, wantedIds) {
    const byId = new Map((builds || []).map((row) => [row.id, row]));
    const hit = (wantedIds || []).find((id) => id && byId.has(id));
    return hit ? byId.get(hit) : ((builds && builds[0]) || null);
  }

  _claimingFramework(pool) {
    const claimed = this._preferredIds().find((id) => pool.some((row) => row.id === id));
    return claimed ? this._frameworkOf(pool, claimed) : null;
  }

  _preferredIds() {
    return Array.isArray(this._model.preferredRuntimes) ? this._model.preferredRuntimes : [];
  }

  _frameworkOf(pool, runtimeId) {
    const row = runtimeId ? pool.find((candidate) => candidate.id === runtimeId) : null;
    return row ? RuntimeFrameworks.frameworkIdOf(row) : null;
  }

  _modelPath() {
    const weights = Array.isArray(this._model.weights) ? this._model.weights[0] : null;
    return (weights && weights.path) || null;
  }

  static _byFramework(rows) {
    const byFramework = new Map();
    for (const row of rows) {
      const id = RuntimeFrameworks.frameworkIdOf(row);
      if (!byFramework.has(id)) byFramework.set(id, []);
      byFramework.get(id).push(row);
    }
    return byFramework;
  }
}

module.exports = ModelRuntimeResolver;
