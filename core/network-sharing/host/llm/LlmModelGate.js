class LlmModelGate {
  static async denied(service, model) {
    const allowed = await service.allowedLlmRefs();
    if (String(model).startsWith('local::')) {
      return [...allowed].some((ref) => ref.startsWith('local::')) ? null : 'local model is not shared';
    }
    return allowed.has(model) ? null : 'model is not available';
  }

  static async modelList(service) {
    const data = (await service.buildManifest()).llms.map((model) => ({
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
