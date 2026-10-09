const EditProfiles = require('../../../../../image-server/prompt/EditProfiles');
const ImageModelResolver = require('../../../../../image-server/router/ImageModelResolver');
const BridgeGlobals = require('../../BridgeGlobals');
const EditReferences = require('./EditReferences');

class EditModelChoice {
  static async resolve(imageRouter) {
    const choice = new EditModelChoice();
    await choice._readLocalDefaults(imageRouter);
    choice._readRemoteEditor();
    return choice;
  }

  constructor() {
    this.editModelId = null;
    this.unifiedGenEdit = false;
    this.editFamily = null;
    this.remoteEdit = false;
  }

  get editCapable() {
    return !!(this.remoteEdit || this.editModelId || this.unifiedGenEdit);
  }

  get profile() {
    return this.remoteEdit ? null : EditProfiles.editProfileFor(this.editFamily);
  }

  get maxReferences() {
    const profile = this.profile;
    return profile ? profile.maxReferences : EditReferences.MAX;
  }

  async _readLocalDefaults(imageRouter) {
    try {
      const svc = BridgeGlobals.imageServerService();
      const defaults = (svc && svc.getDefaults) ? svc.getDefaults() : {};
      this.editModelId = defaults.editModelId || null;
      const lookup = EditModelChoice._recordLookup(imageRouter, svc);
      if (this.editModelId && lookup) {
        const rec = await lookup(this.editModelId);
        this.editFamily = (rec && rec.family) || null;
      } else if (!this.editModelId && defaults.modelId && lookup) {
        const rec = await lookup(defaults.modelId);
        this.unifiedGenEdit = !!(rec && rec.supportsEdit);
        if (this.unifiedGenEdit) this.editFamily = rec.family || null;
      }
    } catch (_) {}
  }

  static _recordLookup(imageRouter, svc) {
    if (imageRouter && typeof imageRouter.resolveModelRecord === 'function') return (id) => imageRouter.resolveModelRecord(id);
    if (!imageRouter || !svc || typeof svc.getModelsDirConfig !== 'function') return null;
    const resolver = new ImageModelResolver({ imageServerService: svc });
    return (id) => resolver.resolve(id);
  }

  _readRemoteEditor() {
    try {
      const svc = BridgeGlobals.imageServerService();
      const activeEdit = (svc && svc.getActiveServer) ? svc.getActiveServer('image-edit') : null;
      this.remoteEdit = !!(activeEdit && activeEdit.location === 'remote');
    } catch (_) {}
  }
}

module.exports = EditModelChoice;
