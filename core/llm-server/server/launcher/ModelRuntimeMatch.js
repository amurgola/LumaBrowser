class ModelRuntimeMatch {
  static CODE = 'MODEL_RUNTIME_MISMATCH';

  static refusal(model, runtime) {
    return ModelRuntimeMatch._boundKindRefusal(model, runtime)
      || ModelRuntimeMatch._compatibleRuntimeRefusal(model, runtime);
  }

  static _boundKindRefusal(model, runtime) {
    const boundKinds = Array.isArray(runtime.modelKinds) ? runtime.modelKinds : null;
    if (!boundKinds || boundKinds.includes(model.kind)) return null;
    return {
      success: false,
      error: `${runtime.name} only loads ${boundKinds.join('/')} models; ${model.name} is a ${model.kind} model. Pick a matching model in Setup → Defaults.`,
      code: ModelRuntimeMatch.CODE,
    };
  }

  static _compatibleRuntimeRefusal(model, runtime) {
    const compatible = model.compatibleRuntimes;
    if (model.kind === 'weights' || !Array.isArray(compatible) || compatible.length === 0) return null;
    if (compatible.includes(runtime.id)) return null;
    return {
      success: false,
      error: `${model.name} only runs on ${compatible.join(', ')}; the selected runtime is ${runtime.name}. Pick that runtime in Setup → Defaults.`,
      code: ModelRuntimeMatch.CODE,
    };
  }
}

module.exports = ModelRuntimeMatch;
