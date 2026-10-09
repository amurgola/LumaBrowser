const ImageLoraCatalog = require('../models/ImageLoraCatalog');
const ImageModelManifest = require('./ImageModelManifest');
const ImageSlots = require('./ImageSlots');
const LoraPresetRecipe = require('./LoraPresetRecipe');

class ModelLoraAttacher {
  static NO_MANIFEST = 'This model has no manifest to update (only imported/downloaded models can take a LoRA here).';

  constructor({ imageServerService, loraCatalog = new ImageLoraCatalog() }) {
    this._svc = imageServerService;
    this._loraCatalog = loraCatalog;
    this._slots = new ImageSlots(imageServerService);
  }

  async attach({ id, loras, distilledPreset, preset } = {}) {
    if (!id || typeof id !== 'string') throw new Error('id required');
    const dir = this._modelDir(id);
    const manifest = ModelLoraAttacher._readManifest(dir);
    this._applyLoras(manifest, LoraPresetRecipe.cleanLoras(loras), { distilledPreset, preset });
    ImageModelManifest.write(dir, manifest);
    await this._slots.stopHosting(id);
  }

  _applyLoras(manifest, clean, { distilledPreset, preset }) {
    const defaults = manifest.defaults = manifest.defaults || {};
    if (clean.length) defaults.loras = clean; else delete defaults.loras;
    if (distilledPreset && clean.length) LoraPresetRecipe.apply(defaults, this._presetFor(clean, preset));
    else LoraPresetRecipe.remove(defaults);
  }

  _presetFor(clean, preset) {
    if (preset && typeof preset === 'object') return preset;
    return LoraPresetRecipe.curatedPreset(clean, this._loraCatalog) || {};
  }

  _modelDir(id) {
    const dir = ImageModelManifest.modelDir(this._svc.getModelsDirConfig().effectivePath, id);
    if (!dir || !ImageModelManifest.exists(dir)) throw new Error(ModelLoraAttacher.NO_MANIFEST);
    return dir;
  }

  static _readManifest(dir) {
    try {
      return ImageModelManifest.read(dir);
    } catch (err) {
      throw new Error('Could not read manifest: ' + err.message);
    }
  }
}

module.exports = ModelLoraAttacher;
