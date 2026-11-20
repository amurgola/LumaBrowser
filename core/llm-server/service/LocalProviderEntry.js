const path = require('path');

class LocalProviderEntry {
  static ID = 'core.llmServer.local';
  static MANAGED_BY = 'core.llmServer';
  static FALLBACK_PORT = 8080;
  static LABEL_PREFIX = 'Local · ';

  static compute({ defaults, port, resolveDisplayName, installed = [] }) {
    if (!defaults.runtimeId || !defaults.modelPath) return null;
    const modelName = path.basename(defaults.modelPath, path.extname(defaults.modelPath));
    const displayName = resolveDisplayName(modelName);
    return {
      id: LocalProviderEntry.ID,
      name: LocalProviderEntry.LABEL_PREFIX + displayName,
      displayName,
      type: 'openai',
      endpoint: `http://127.0.0.1:${port || LocalProviderEntry.FALLBACK_PORT}`,
      apiKey: '',
      selectedModel: modelName,
      models: LocalProviderEntry._models(modelName, displayName, installed),
      managedByCore: true,
      managedBy: LocalProviderEntry.MANAGED_BY,
      managedRuntimeId: defaults.runtimeId,
    };
  }

  static _models(modelName, displayName, installed) {
    const known = (installed || []).filter((model) => model && model.stem);
    const own = known.find((model) => model.stem === modelName) || { stem: modelName, display: displayName };
    return [own, ...known.filter((model) => model.stem !== modelName)]
      .map((model) => ({ id: model.stem, luma_label: LocalProviderEntry.LABEL_PREFIX + (model.display || model.stem) }));
  }

  static queueKey(entry) {
    return entry && entry.selectedModel ? `${entry.id}::${entry.selectedModel}` : null;
  }
}

module.exports = LocalProviderEntry;
