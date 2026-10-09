const fs = require('fs');
const path = require('path');
const CheckpointClassifier = require('../models/existing/CheckpointClassifier');
const ExistingImageLibraryScanner = require('../models/existing/ExistingImageLibraryScanner');
const ExistingImageModelLinker = require('../models/existing/ExistingImageModelLinker');
const FileLinker = require('../../shared/fs/FileLinker');
const ImageManifestBuilder = require('./ImageManifestBuilder');
const ImageModelManifest = require('./ImageModelManifest');
const ImportedEntryBuilder = require('./ImportedEntryBuilder');

class ExistingModelAdopter {
  static MAX_ID_SUFFIX = 9;

  constructor(imageServerService) {
    this._svc = imageServerService;
  }

  scan(args = {}) {
    const roots = Array.isArray(args && args.roots) ? args.roots.filter((r) => typeof r === 'string' && r) : null;
    return ExistingImageLibraryScanner.scan({ modelsDir: this._modelsDir(), roots });
  }

  async adopt(args = {}) {
    const sourcePath = args.sourcePath;
    if (!sourcePath || typeof sourcePath !== 'string') throw new Error('A source path is required.');
    const { entry, name } = ExistingModelAdopter._entryFor(sourcePath, args);
    const placed = this._placeUnderFreeId(entry, sourcePath, name);
    if (placed.mode !== 'existing' || !ImageModelManifest.exists(placed.dir)) {
      entry.linkedFrom = sourcePath;
      ImageModelManifest.writeQuietly(placed.dir, ImageManifestBuilder.forImport(entry), 'import manifest');
    }
    return { id: entry.id, dir: placed.dir, mode: placed.mode };
  }

  static _entryFor(sourcePath, args) {
    const verdict = CheckpointClassifier.classify(sourcePath);
    if (!verdict.compatible) throw new Error(verdict.reason || 'That checkpoint cannot be linked.');
    const name = (args.name && String(args.name).trim()) || path.basename(sourcePath).replace(/\.[^.]+$/, '');
    const synth = ImportedEntryBuilder.build({ name, srcPath: sourcePath, baseType: verdict.baseType, promptStyle: args.promptStyle || verdict.promptStyle });
    if (synth.error) throw new Error(synth.error);
    return { entry: synth.entry, name };
  }

  _placeUnderFreeId(entry, sourcePath, name) {
    const baseId = entry.id;
    const fileName = entry.files.diffusion.file;
    for (let n = 1; n <= ExistingModelAdopter.MAX_ID_SUFFIX; n++) {
      entry.id = n === 1 ? baseId : `${baseId}-${n}`;
      const dir = path.join(this._modelsDir(), entry.id);
      if (fs.existsSync(dir) && !FileLinker.isSameFile(sourcePath, path.join(dir, fileName))) continue;
      return ExistingModelAdopter._link(sourcePath, dir, fileName, name);
    }
    throw new Error(`A different model named "${name}" is already installed.`);
  }

  static _link(sourcePath, dir, fileName, name) {
    const res = ExistingImageModelLinker.link({ sourcePath, destDir: dir, fileName });
    if (res.success) return { dir, mode: res.mode };
    try { fs.rmdirSync(dir); } catch (_) {}
    throw new Error(res.clash ? `A different model named "${name}" is already installed.` : res.error);
  }

  _modelsDir() {
    return this._svc.getModelsDirConfig().effectivePath;
  }
}

module.exports = ExistingModelAdopter;
