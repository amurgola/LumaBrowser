const AccessPolicy = require('../AccessPolicy');

class LlmModelGate {
  static async denied(service, model, credential = null) {
    const allowed = await service.allowedLlmRefs(credential);
    if (String(model).startsWith('local::') && !AccessPolicy.restrictsLlms(credential)) {
      return [...allowed].some((ref) => ref.startsWith('local::')) ? null : 'local model is not shared';
    }
    return allowed.has(model) ? null : 'model is not available';
  }

  static async modelList(service, credential = null) {
    const data = (await service.buildManifest(credential)).llms.map((model) => ({
      id: model.ref,
      object: 'model',
      owned_by: 'lumabrowser',
      created: 0,
      luma_label: model.label,
      luma_kind: model.kind,
      luma_current: !!model.current,
    }));
    return { object: 'list', data };
  }
}

module.exports = LlmModelGate;
