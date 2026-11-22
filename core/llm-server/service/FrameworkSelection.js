const KeyedSettings = require('./KeyedSettings');
const ModelFrameworkPins = require('./ModelFrameworkPins');

class FrameworkSelection extends KeyedSettings {
  static FRAMEWORK_PREFIX = 'core.llmServer.frameworks.';
  static ACTIVE_BUILD_SUFFIX = '.activeBuild';
  static FORMAT_PREFIX = 'core.llmServer.formats.';
  static FORMAT_FRAMEWORK_SUFFIX = '.framework';

  constructor(settingsDb, { pins = new ModelFrameworkPins(settingsDb) } = {}) {
    super(settingsDb);
    this._pins = pins;
  }

  activeBuild(frameworkId) {
    return this._read(FrameworkSelection._activeBuildKey(frameworkId));
  }

  setActiveBuild(frameworkId, runtimeId) {
    this._write(FrameworkSelection._activeBuildKey(frameworkId), runtimeId);
  }

  formatFramework(format) {
    return this._read(FrameworkSelection._formatKey(format));
  }

  setFormatFramework(format, frameworkId) {
    this._write(FrameworkSelection._formatKey(format), frameworkId);
  }

  modelFramework(modelPathOrStem) {
    return this._pins.resolve(modelPathOrStem) || null;
  }

  setModelFramework(modelPath, frameworkId) {
    this._pins.setForModel(modelPath, frameworkId);
  }

  _read(key) {
    const value = key ? this._db.get(key, null) : null;
    return typeof value === 'string' && value ? value : null;
  }

  _write(key, value) {
    if (!key) return;
    this._setOrDelete(key, typeof value === 'string' && value ? value : null);
  }

  static _activeBuildKey(frameworkId) {
    return frameworkId ? `${FrameworkSelection.FRAMEWORK_PREFIX}${frameworkId}${FrameworkSelection.ACTIVE_BUILD_SUFFIX}` : null;
  }

  static _formatKey(format) {
    return format ? `${FrameworkSelection.FORMAT_PREFIX}${format}${FrameworkSelection.FORMAT_FRAMEWORK_SUFFIX}` : null;
  }
}

module.exports = FrameworkSelection;
