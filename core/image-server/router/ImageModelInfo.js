const EditFrames = require('../EditFrames');
const ImageFamilyScaffold = require('./ImageFamilyScaffold');
const ImageModelResolver = require('./ImageModelResolver');

class ImageModelInfo {
  static GENERATE_FALLBACK_SIDE = 512;

  static FRAME_FALLBACK_SIDE = 1024;

  static FRAME_FALLBACK_GRID = 64;

  constructor({ imageServerService, models }) {
    this._svc = imageServerService;
    this._models = models;
  }

  async nativeSize(modelRef = null) {
    const model = await this._safeResolve(() => ImageModelResolver.idFor(modelRef, this._svc.getDefaults().modelId));
    if (!model) return null;
    const native = ImageModelInfo._nativeOf(model, ImageModelInfo.GENERATE_FALLBACK_SIDE);
    return { modelId: model.id, width: native.width, height: native.height };
  }

  async frameSizes(modelRef = null) {
    const model = await this._safeResolve(() => {
      const defaults = this._svc.getDefaults();
      return ImageModelResolver.idFor(modelRef, defaults.editModelId || defaults.modelId);
    });
    if (!model) return null;
    const native = ImageModelInfo._nativeOf(model, ImageModelInfo.FRAME_FALLBACK_SIDE);
    const grid = ImageModelInfo.gridOf(model, ImageModelInfo.FRAME_FALLBACK_GRID);
    return { modelId: model.id, label: ImageModelInfo.labelOf(model), native, grid, frames: EditFrames.listFrames({ native, grid }) };
  }

  async activePromptInfo(role = 'generate') {
    const model = await this._safeResolve(() => {
      const defaults = this._svc.getDefaults();
      return role === 'edit' ? (defaults.editModelId || defaults.modelId) : defaults.modelId;
    });
    if (!model) return null;
    const md = ImageFamilyScaffold.merge(model);
    return {
      modelId: model.id,
      label: ImageModelInfo.labelOf(model),
      family: model.family || null,
      promptGuide: md.promptGuide ? String(md.promptGuide) : null,
      negativePrompt: md.negativePrompt ? String(md.negativePrompt) : null,
    };
  }

  static labelOf(model) {
    return model.label || model.displayName || model.id;
  }

  static gridOf(model, fallback) {
    const grid = Number(model && model.constraints && model.constraints.dimensionMultiple);
    return grid > 1 ? grid : fallback;
  }

  static _nativeOf(model, fallbackSide) {
    const md = ImageFamilyScaffold.merge(model);
    return { width: ImageModelInfo._side(md.width, fallbackSide), height: ImageModelInfo._side(md.height, fallbackSide) };
  }

  static _side(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  async _safeResolve(pickId) {
    try {
      const id = pickId();
      return id ? await this._models.resolve(id) : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ImageModelInfo;
