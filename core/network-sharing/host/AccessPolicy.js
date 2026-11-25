const UserOverrides = require('./UserOverrides');

class AccessPolicy {
  static NOT_AVAILABLE = 'model is not available';

  static overridesOf(credential) {
    return credential && credential.overrides ? UserOverrides.normalize(credential.overrides) : null;
  }

  static flags(hostFlags, credential) {
    const overrides = AccessPolicy.overridesOf(credential);
    return overrides ? { ...hostFlags, ...overrides.shareFlags } : { ...hostFlags };
  }

  static listOf(credential, field) {
    const overrides = AccessPolicy.overridesOf(credential);
    return overrides ? overrides[field] : null;
  }

  static restrictsLlms(credential) {
    return AccessPolicy.listOf(credential, 'llms') !== null;
  }

  static restrictsImageModels(credential) {
    return AccessPolicy.listOf(credential, 'imageModels') !== null;
  }

  static imageModelDenied(credential, modelId) {
    const allowed = AccessPolicy.listOf(credential, 'imageModels');
    if (allowed === null) return null;
    return modelId && allowed.includes(modelId) ? null : AccessPolicy.NOT_AVAILABLE;
  }

  static narrowManifest(manifest, credential) {
    const llms = AccessPolicy.listOf(credential, 'llms');
    const imageModels = AccessPolicy.listOf(credential, 'imageModels');
    if (llms !== null) manifest.llms = manifest.llms.filter((model) => llms.includes(model.ref));
    if (imageModels !== null) AccessPolicy._narrowImageSlots(manifest.image, imageModels);
    return manifest;
  }

  static _narrowImageSlots(image, allowed) {
    for (const slot of Object.values(image || {})) {
      if (slot && Array.isArray(slot.models)) slot.models = slot.models.filter((model) => allowed.includes(model.id));
    }
  }
}

module.exports = AccessPolicy;
