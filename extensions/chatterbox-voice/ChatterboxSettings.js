const fs = require('fs');
const path = require('path');
const CoreRequire = require('./CoreRequire');

class ChatterboxSettings {
  static FILE = 'settings.json';
  static DEFAULT_IDLE_MS = 5 * 60 * 1000;

  constructor() {
    this.values = { preferredRuntimeId: null, idleMs: ChatterboxSettings.DEFAULT_IDLE_MS, kittenPreset: null, cloneModelId: null };
  }

  static appBaseDir() {
    return CoreRequire.load('shared/AppPaths').appBaseDir();
  }

  static runtimesDir() {
    return path.join(ChatterboxSettings.appBaseDir(), 'runtimes');
  }

  static modelsDir() {
    return path.join(ChatterboxSettings.appBaseDir(), 'models', 'tts', 'chatterbox');
  }

  get preferredRuntimeId() {
    return this.values.preferredRuntimeId;
  }

  get idleMs() {
    return this.values.idleMs || ChatterboxSettings.DEFAULT_IDLE_MS;
  }

  get kittenPreset() {
    return this.values.kittenPreset || null;
  }

  get cloneModelId() {
    return this.values.cloneModelId || null;
  }

  setKittenPreset(name) {
    this.values.kittenPreset = name ? String(name) : null;
    this._save();
  }

  setCloneModel(id) {
    this.values.cloneModelId = id ? String(id) : null;
    this._save();
  }

  load() {
    try {
      this.values = { ...this.values, ...JSON.parse(fs.readFileSync(ChatterboxSettings._path(), 'utf8')) };
    } catch (_) {}
  }

  setPreferredRuntime(id) {
    this.values.preferredRuntimeId = id || null;
    this._save();
  }

  _save() {
    fs.mkdirSync(ChatterboxSettings.modelsDir(), { recursive: true });
    fs.writeFileSync(ChatterboxSettings._path(), JSON.stringify(this.values, null, 2));
  }

  static _path() {
    return path.join(ChatterboxSettings.modelsDir(), ChatterboxSettings.FILE);
  }
}

module.exports = ChatterboxSettings;
