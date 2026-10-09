const fs = require('fs');
const path = require('path');
const ModelDirWalker = require('./scanner/ModelDirWalker');
const GgufModelGrouper = require('./scanner/GgufModelGrouper');
const MlxModelBuilder = require('./scanner/MlxModelBuilder');
const AddonModelBuilder = require('./scanner/AddonModelBuilder');
const ModelClassifier = require('./scanner/ModelClassifier');
const GgufHeaderAttacher = require('./scanner/GgufHeaderAttacher');
const GgufHeaderCache = require('./scanner/GgufHeaderCache');
const GgufParseWorkerClient = require('./scanner/GgufParseWorkerClient');
const ModelSidecars = require('./scanner/ModelSidecars');
const BoundedParallel = require('./scanner/BoundedParallel');

class LlmModelsScanner {
  static PARSE_CONCURRENCY = 4;

  static HEADER_CACHE_FILE = 'gguf-header-cache.json';

  static shared = new LlmModelsScanner();

  constructor({ headerCache = LlmModelsScanner.defaultHeaderCache(), registry } = {}) {
    this._headerCache = headerCache;
    this._registry = registry;
  }

  static spawnParseWorker() {
    const { Worker } = require('worker_threads');
    return new Worker(path.join(__dirname, 'ggufParseWorker.js'));
  }

  static defaultHeaderCache() {
    const worker = new GgufParseWorkerClient({ spawn: () => LlmModelsScanner.spawnParseWorker() });
    return new GgufHeaderCache({
      parse: (filePath) => worker.parse(filePath),
      persistPath: () => LlmModelsScanner._userDataCachePath(),
    });
  }

  async scan(rootDir) {
    const unavailable = await LlmModelsScanner._checkRoot(rootDir);
    if (unavailable) return unavailable;
    const walk = await new ModelDirWalker().walk(rootDir);
    const models = this._buildModels(walk, rootDir);
    await this._readHeaders(models);
    await ModelSidecars.attach(models);
    LlmModelsScanner._sort(models);
    return { available: true, dir: rootDir, models, truncated: walk.visited >= ModelDirWalker.MAX_ENTRIES };
  }

  _buildModels(walk, rootDir) {
    const models = [
      ...GgufModelGrouper.group(walk.ggufs, rootDir),
      ...MlxModelBuilder.build(walk.mlxDirs, rootDir),
      ...AddonModelBuilder.build(walk.addonFiles, rootDir),
    ];
    for (const model of models) Object.assign(model, ModelClassifier.classify(model, this._registry));
    return models;
  }

  async _readHeaders(models) {
    const targets = models.filter((model) => GgufHeaderAttacher.isTarget(model));
    await BoundedParallel.map(targets, LlmModelsScanner.PARSE_CONCURRENCY,
      (model) => GgufHeaderAttacher.attach(model, this._headerCache));
    await this._headerCache.flush();
  }

  static async _checkRoot(rootDir) {
    if (!rootDir) return { available: false, reason: 'No directory configured', models: [], dir: null };
    let stat;
    try {
      stat = await fs.promises.stat(rootDir);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return { available: false, reason: `Directory does not exist: ${rootDir}`, models: [], dir: rootDir, missing: true };
      }
      return { available: false, reason: err.message, models: [], dir: rootDir };
    }
    if (!stat.isDirectory()) return { available: false, reason: `Not a directory: ${rootDir}`, models: [], dir: rootDir };
    return null;
  }

  static _sort(models) {
    models.sort((a, b) => {
      if (a.relativeDirectory !== b.relativeDirectory) return a.relativeDirectory.localeCompare(b.relativeDirectory);
      return a.name.localeCompare(b.name);
    });
  }

  static _userDataCachePath() {
    const { app } = require('electron');
    return path.join(app.getPath('userData'), LlmModelsScanner.HEADER_CACHE_FILE);
  }
}

module.exports = LlmModelsScanner;
