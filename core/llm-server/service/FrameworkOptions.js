const KeyedSettings = require('./KeyedSettings');
const FrameworkSelection = require('./FrameworkSelection');
const FrameworkOptionValue = require('./FrameworkOptionValue');
const SleepRamNote = require('./SleepRamNote');
const FrameworkOptionDeclarations = require('../runtimes/FrameworkOptionDeclarations');
const RuntimeFrameworks = require('../runtimes/RuntimeFrameworks');

class FrameworkOptions extends KeyedSettings {
  static OPTIONS_SUFFIX = '.options';

  static DEFAULT_FIELDS = Object.freeze([
    'kvCacheType', 'maxConcurrent', 'tensorSplit', 'cacheReuse', 'cpuMoe', 'noMoeGpuCache', 'usePeerGpus', 'pinModelRam', 'openvinoDevice',
  ]);

  constructor(settingsDb, { catalog = null, globalDefaults = () => ({}), sleepNote = null } = {}) {
    super(settingsDb);
    this._catalog = catalog;
    this._globalDefaults = globalDefaults;
    this._sleepNote = sleepNote;
  }

  values(frameworkId) {
    const stored = frameworkId ? this._db.get(FrameworkOptions._key(frameworkId), null) : null;
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? { ...stored } : {};
  }

  set(frameworkId, optionId, value) {
    if (!frameworkId || !optionId) return this.values(frameworkId);
    const values = this.values(frameworkId);
    const normalized = FrameworkOptionValue.normalize(optionId, value, this._customDeclaration(frameworkId, optionId));
    if (normalized === null) delete values[optionId];
    else values[optionId] = normalized;
    this._setOrDelete(FrameworkOptions._key(frameworkId), Object.keys(values).length > 0 ? values : null);
    return values;
  }

  overlay(defaults, frameworkId) {
    const own = this.values(frameworkId);
    const overlaid = { ...defaults };
    for (const field of FrameworkOptions.DEFAULT_FIELDS) {
      if (FrameworkOptions._has(own, field)) overlaid[field] = own[field];
    }
    return overlaid;
  }

  describe(framework, activeBuildRow) {
    const frameworkId = (framework && framework.id) || RuntimeFrameworks.frameworkIdOf(activeBuildRow);
    const own = this.values(frameworkId);
    const global = this._globalDefaults() || {};
    return this._declared(activeBuildRow).map((option) => (option.custom
      ? this._describeCustom(option, own, activeBuildRow)
      : FrameworkOptions._describeKnown(option.id, own, global)));
  }

  declaredOnly(defaults, buildRow) {
    const declared = this._declared(buildRow).map((option) => option.id);
    const result = { ...defaults };
    for (const id of FrameworkOptionDeclarations.KNOWN_IDS.filter((known) => !declared.includes(known))) {
      result[id] = FrameworkOptionValue.unset(id);
    }
    return result;
  }

  launchValues(buildRow) {
    const own = this.values(RuntimeFrameworks.frameworkIdOf(buildRow));
    const values = {};
    for (const option of this._declared(buildRow).filter((candidate) => candidate.custom)) {
      values[option.id] = FrameworkOptions._customValue(option, own).value;
    }
    return values;
  }

  _declared(buildRow) {
    const entry = (buildRow && this._catalog && this._catalog.getById(buildRow.id)) || buildRow;
    return FrameworkOptionDeclarations.of(entry);
  }

  _customDeclaration(frameworkId, optionId) {
    if (!this._catalog || typeof this._catalog.getCatalog !== 'function') return null;
    const builds = this._catalog.getCatalog().filter((entry) => RuntimeFrameworks.frameworkIdOf(entry) === frameworkId);
    return FrameworkOptionDeclarations.customOf(builds, optionId);
  }

  _describeCustom(option, own, buildRow) {
    const { ramNote, ...custom } = option.custom;
    const note = ramNote === SleepRamNote.KIND && this._sleepNote ? this._sleepNote.noteFor(buildRow) : null;
    return { id: option.id, ...FrameworkOptions._customValue(option, own), custom, note };
  }

  static _customValue(option, own) {
    const stored = FrameworkOptions._has(own, option.id) ? FrameworkOptionValue.normalize(option.id, own[option.id], option.custom) : null;
    return stored === null ? { value: option.custom.default, own: false } : { value: stored, own: true };
  }

  static _describeKnown(id, own, global) {
    const has = FrameworkOptions._has(own, id);
    const value = has ? own[id] : global[id];
    return { id, value: value === undefined ? null : value, own: has };
  }

  static _has(values, field) {
    return Object.prototype.hasOwnProperty.call(values, field);
  }

  static _key(frameworkId) {
    return `${FrameworkSelection.FRAMEWORK_PREFIX}${frameworkId}${FrameworkOptions.OPTIONS_SUFFIX}`;
  }
}

module.exports = FrameworkOptions;
