const RuntimeCatalogRegistry = require('../runtimes/RuntimeCatalogRegistry');

class ModelClassifier {
  static LLAMA_CPP_RUNTIMES = ['llama-cpp-cuda13', 'llama-cpp-cuda12', 'llama-cpp-vulkan', 'llama-cpp-cpu'];

  static classify(model, registry = RuntimeCatalogRegistry.shared) {
    if (model.kind === 'mlx') return ModelClassifier._bound(['mlx-lm']);
    if (model.addon) return ModelClassifier._bound(ModelClassifier._addonRuntimes(model, registry));
    const haystack = ModelClassifier._haystack(model);
    const formatRequirements = /\bgpt-oss\b/.test(haystack) ? ['harmony'] : [];
    if (model.kind === 'mmproj-only' || model.kind === 'mtp-only') {
      return { formatRequirements, preferredRuntimes: [], compatibleRuntimes: [], mtpCapable: false };
    }
    return {
      formatRequirements,
      preferredRuntimes: ModelClassifier._quantPreferredRuntimes(haystack, registry),
      compatibleRuntimes: ModelClassifier.LLAMA_CPP_RUNTIMES.slice(),
      mtpCapable: ModelClassifier._mtpCapable(haystack, model),
    };
  }

  static augmentFromGguf(model) {
    const gguf = model.gguf;
    if (!gguf || !gguf.parsed) return;
    if (ModelClassifier._isGptOss(gguf)) {
      if (!Array.isArray(model.formatRequirements)) model.formatRequirements = [];
      if (!model.formatRequirements.includes('harmony')) model.formatRequirements.push('harmony');
    }
    if (typeof gguf.mtpGrafted === 'boolean') {
      model.mtpGrafted = gguf.mtpGrafted;
      if (gguf.mtpGrafted) model.mtpCapable = true;
    }
  }

  static _haystack(model) {
    return [
      (model.name || '').toLowerCase(),
      (model.relativeDirectory || '').toLowerCase(),
      ...(model.weights || []).map((w) => (w.name || '').toLowerCase()),
    ].join(' ');
  }

  static _bound(runtimes) {
    return { formatRequirements: [], preferredRuntimes: runtimes.slice(), compatibleRuntimes: runtimes.slice(), mtpCapable: false };
  }

  static _addonRuntimes(model, registry) {
    if (model.addon.requiresRuntime) return [model.addon.requiresRuntime];
    try {
      return registry.runtimesForModelKind(model.kind);
    } catch (_) {
      return [];
    }
  }

  static _quantPreferredRuntimes(haystack, registry) {
    const preferred = [];
    try {
      for (const id of registry.runtimesPreferringQuant(haystack)) {
        if (!preferred.includes(id)) preferred.push(id);
      }
    } catch (_) {
    }
    return preferred;
  }

  static _mtpCapable(haystack, model) {
    return /\bmtp\b/i.test(haystack) || !!(model.mtp && model.mtp.length > 0);
  }

  static _isGptOss(gguf) {
    const arch = (gguf.architecture || '').toLowerCase();
    const name = (gguf.name || '').toLowerCase();
    return arch === 'gptoss' || arch === 'gpt-oss' || /\bgpt-?oss\b/.test(name);
  }
}

module.exports = ModelClassifier;
