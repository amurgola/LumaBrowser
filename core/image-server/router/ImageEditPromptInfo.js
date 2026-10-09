const EditGuide = require('../prompt/EditGuide');
const EditProfiles = require('../prompt/EditProfiles');
const ImageModelInfo = require('./ImageModelInfo');

class ImageEditPromptInfo {
  constructor({ imageServerService, models }) {
    this._svc = imageServerService;
    this._models = models;
  }

  async resolve() {
    try {
      if (this._editorIsRemote()) return ImageEditPromptInfo._reference(null);
      const defaults = this._svc.getDefaults();
      const editModel = await this._editDefault(defaults);
      if (editModel) return ImageEditPromptInfo._reference(editModel);
      return await this._fromGenerationDefault(defaults);
    } catch (_) {
      return null;
    }
  }

  _editorIsRemote() {
    const active = this._svc.getActiveServer ? this._svc.getActiveServer('image-edit') : null;
    return !!(active && active.location === 'remote');
  }

  async _editDefault(defaults) {
    return defaults.editModelId ? this._models.resolve(defaults.editModelId) : null;
  }

  async _fromGenerationDefault(defaults) {
    if (!defaults.modelId) return null;
    const gen = await this._models.resolve(defaults.modelId);
    if (!gen) return null;
    if (!defaults.editModelId && gen.supportsEdit) return ImageEditPromptInfo._reference(gen);
    return ImageEditPromptInfo._img2img(gen);
  }

  static _reference(model) {
    const family = (model && model.family) || null;
    const label = model ? ImageModelInfo.labelOf(model) : '';
    const profile = EditProfiles.editProfileFor(family);
    return {
      mode: 'reference',
      modelId: model ? model.id : null,
      label,
      family,
      refTag: profile ? profile.refTag : 'word',
      maxReferences: profile ? profile.maxReferences : EditProfiles.DEFAULT_MAX_REFERENCES,
      guide: EditGuide.build({ mode: 'reference', label, family }),
    };
  }

  static _img2img(gen) {
    const label = ImageModelInfo.labelOf(gen);
    return {
      mode: 'img2img',
      modelId: gen.id,
      label,
      family: gen.family || null,
      refTag: 'word',
      maxReferences: 0,
      guide: EditGuide.build({ mode: 'img2img', label }),
    };
  }
}

module.exports = ImageEditPromptInfo;
