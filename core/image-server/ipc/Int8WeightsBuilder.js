const path = require('path');
const ImageModelsScanner = require('../ImageModelsScanner');
const Int8ConvrotConverter = require('../models/int8/Int8ConvrotConverter');
const Int8ConvrotRecipes = require('../models/int8/Int8ConvrotRecipes');
const ImageModelManifest = require('./ImageModelManifest');
const ImageSlots = require('./ImageSlots');

class Int8WeightsBuilder {
  static SOURCE_EXT = '.safetensors';
  static SUFFIX = '.int8.safetensors';
  static SIZE_RATIO = 0.56;
  static PROGRESS_TICK_MS = 250;
  static BUSY = 'Faster weights are already being built for this model.';
  static NOT_BUILDABLE = 'Faster weights cannot be built for this model.';
  static ALREADY_BUILT = 'This model already has faster weights.';

  constructor({ imageServerService, scanner = new ImageModelsScanner(), converter = Int8ConvrotConverter }) {
    this._svc = imageServerService;
    this._scanner = scanner;
    this._converter = converter;
    this._slots = new ImageSlots(imageServerService);
    this._builds = new Map();
  }

  static canBuild(model) {
    const diffusion = model && model.files && model.files.diffusion;
    const listed = model && model.manifest && model.manifest.files && model.manifest.files.diffusion;
    return !!(diffusion && diffusion.path && listed && Int8ConvrotRecipes.forFamily(model.family)
      && path.extname(diffusion.path).toLowerCase() === Int8WeightsBuilder.SOURCE_EXT);
  }

  static fileNameFor(sourceFile) {
    return path.basename(sourceFile, path.extname(sourceFile)) + Int8WeightsBuilder.SUFFIX;
  }

  describe(model) {
    const diffusion = (model && model.files && model.files.diffusion) || {};
    const present = !!diffusion.int8Path;
    return {
      buildable: Int8WeightsBuilder.canBuild(model),
      present,
      file: present ? diffusion.int8File : null,
      bytes: present ? diffusion.int8Bytes : null,
      estimatedBytes: diffusion.bytes ? Math.round(diffusion.bytes * Int8WeightsBuilder.SIZE_RATIO) : null,
      building: this.progressOf(model && model.id),
    };
  }

  progressOf(id) {
    const build = this._builds.get(id);
    return build ? { ...build.progress } : null;
  }

  async build({ id } = {}, send = () => {}) {
    if (!id || typeof id !== 'string') throw new Error('id required');
    if (this._builds.has(id)) throw new Error(Int8WeightsBuilder.BUSY);
    const build = { controller: new AbortController(), progress: { doneBytes: 0, totalBytes: 0 } };
    this._builds.set(id, build);
    try {
      const target = await this._target(id);
      send('int8-start', { id });
      return await this._run(target, build, send);
    } finally {
      this._builds.delete(id);
    }
  }

  cancel(id) {
    const build = this._builds.get(id);
    if (build) build.controller.abort();
  }

  async _target(id) {
    const dir = ImageModelManifest.modelDir(this._svc.getModelsDirConfig().effectivePath, id);
    if (!dir) throw new Error('invalid model id');
    const model = await this._scanner.readModelDir(dir, id);
    if (!model) throw new Error(`Model "${id}" not found.`);
    if (model.files.diffusion.int8Path) throw new Error(Int8WeightsBuilder.ALREADY_BUILT);
    if (!Int8WeightsBuilder.canBuild(model)) throw new Error(Int8WeightsBuilder.NOT_BUILDABLE);
    const fileName = Int8WeightsBuilder.fileNameFor(model.files.diffusion.file);
    return { id, dir, model, fileName, outputPath: path.join(dir, fileName) };
  }

  async _run(target, build, send) {
    try {
      const result = await this._convert(target, build, send);
      Int8WeightsBuilder._record(target);
      await this._slots.stopHosting(target.id);
      send('int8-end', { id: target.id, outcome: 'done' });
      return { id: target.id, file: target.fileName, bytes: result.bytes };
    } catch (err) {
      const canceled = build.controller.signal.aborted;
      send('int8-end', { id: target.id, outcome: canceled ? 'canceled' : 'error', message: err.message });
      if (canceled) return { success: false, canceled: true };
      throw err;
    }
  }

  _convert(target, build, send) {
    let lastTick = 0;
    return this._converter.convert({
      sourcePath: target.model.files.diffusion.path,
      outputPath: target.outputPath,
      layerPattern: Int8ConvrotRecipes.forFamily(target.model.family).layerPattern,
      signal: build.controller.signal,
      onProgress: (progress) => {
        build.progress = { doneBytes: progress.doneBytes, totalBytes: progress.totalBytes };
        const now = Date.now();
        if (now - lastTick < Int8WeightsBuilder.PROGRESS_TICK_MS) return;
        lastTick = now;
        send('int8-progress', { id: target.id, ...build.progress });
      },
    });
  }

  static _record({ dir, fileName }) {
    const manifest = ImageModelManifest.read(dir);
    manifest.files.diffusion.int8File = fileName;
    ImageModelManifest.write(dir, manifest);
  }
}

module.exports = Int8WeightsBuilder;
