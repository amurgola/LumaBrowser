const fs = require('fs');
const path = require('path');
const ModelDirWalker = require('./scanner/ModelDirWalker');
const GgufModelGrouper = require('./scanner/GgufModelGrouper');
const MlxModelBuilder = require('./scanner/MlxModelBuilder');
const AddonModelBuilder = require('./scanner/AddonModelBuilder');
const ModelClassifier = require('./scanner/ModelClassifier');
const GgufHeaderAttacher = require('./scanner/GgufHeaderAttacher');
const GgufHeaderCache = require('./scanner/GgufHeaderCache');
const GgufRoleResolver = require('./scanner/GgufRoleResolver');
const GgufParseWorkerClient = require('./scanner/GgufParseWorkerClient');
const ModelSidecars = require('./scanner/ModelSidecars');
const BoundedParallel = require('./scanner/BoundedParallel');
const GgufFileName = require('./models/GgufFileName');
const GgufRoleTable = require('./GgufRoleTable');
const ModelFolderRegistry = require('../shared/ModelFolderRegistry');

class LlmModelsScanner {
  static FOLDER_KIND = 'llm';

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
    const walk = await new ModelDirWalker().walk(rootDir, { excludeDirs: ModelFolderRegistry.foldersExcept(LlmModelsScanner.FOLDER_KIND) });
    const roles = await GgufRoleResolver.resolve(walk.ggufs, this._headerCache, LlmModelsScanner.PARSE_CONCURRENCY);
    const { ggufs, diffusion } = LlmModelsScanner._withoutDiffusion(walk.ggufs, roles);
    const models = this._buildModels({ ...walk, ggufs }, rootDir, roles);
    await this._readHeaders(models);
    await ModelSidecars.attach(models);
    LlmModelsScanner._sort(models);
    return {
      available: true,
      dir: rootDir,
      models,
      truncated: walk.visited >= ModelDirWalker.MAX_ENTRIES,
      skipped: { diffusion, excludedDirs: walk.excluded || [] },
    };
  }

  static _withoutDiffusion(files, roles) {
    const stems = new Set();
    for (const file of files) {
      const info = roles.get(file.path);
      if (info && info.role === GgufRoleTable.ROLES.DIFFUSION) stems.add(`${file.directory}|${GgufFileName.split(file.name).stem}`);
    }
    if (!stems.size) return { ggufs: files, diffusion: [] };
    const diffusion = [];
    const ggufs = [];
    for (const file of files) {
      if (stems.has(`${file.directory}|${GgufFileName.split(file.name).stem}`)) diffusion.push(file.path);
      else ggufs.push(file);
    }
    return { ggufs, diffusion };
  }

  _buildModels(walk, rootDir, roles) {
    const models = [
      ...GgufModelGrouper.group(walk.ggufs, rootDir, roles),
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
