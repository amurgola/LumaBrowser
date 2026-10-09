const path = require('path');
const FileProbe = require('./FileProbe');
const LibrarySource = require('./LibrarySource');
const LmStudioSource = require('./LmStudioSource');
const HfCacheSource = require('./HfCacheSource');
const OllamaSource = require('./OllamaSource');

class ExistingLibraryScanner {
  static MIN_MODEL_BYTES = LibrarySource.MIN_MODEL_BYTES;

  static SOURCES = [LmStudioSource, HfCacheSource, OllamaSource];

  static scan({ modelsDir, env } = {}) {
    return new ExistingLibraryScanner(modelsDir, env || process.env).execute();
  }

  constructor(modelsDir, env) {
    this._ownRoot = modelsDir ? path.resolve(modelsDir).toLowerCase() : null;
    this._env = env;
    this._seen = new Set();
  }

  execute() {
    const models = this._collect().filter((model) => this._isNewImport(model));
    models.sort((a, b) => b.bytes - a.bytes);
    return { models, sources: ExistingLibraryScanner._countBySource(models) };
  }

  _collect() {
    return ExistingLibraryScanner.SOURCES.flatMap((Source) => new Source(this._env).scan())
      .map((model) => ExistingLibraryScanner._withRealPath(model));
  }

  _isNewImport(model) {
    if (this._seen.has(model.id)) return false;
    this._seen.add(model.id);
    return !this._isInOwnLibrary(model.id);
  }

  _isInOwnLibrary(key) {
    if (!this._ownRoot) return false;
    return key.startsWith(this._ownRoot + path.sep.toLowerCase()) || path.dirname(key) === this._ownRoot;
  }

  static _withRealPath(model) {
    const realPath = FileProbe.realPath(model.path);
    return { ...model, id: realPath.toLowerCase(), realPath };
  }

  static _countBySource(models) {
    const sources = {};
    for (const model of models) sources[model.source] = (sources[model.source] || 0) + 1;
    return sources;
  }
}

module.exports = ExistingLibraryScanner;
