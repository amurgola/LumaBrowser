const path = require('path');

class LocalProviderEntry {
  static ID = 'core.llmServer.local';
  static MANAGED_BY = 'core.llmServer';
  static FALLBACK_PORT = 8080;

  static compute({ defaults, port, resolveDisplayName }) {
    if (!defaults.runtimeId || !defaults.modelPath) return null;
    const modelName = path.basename(defaults.modelPath, path.extname(defaults.modelPath));
    const displayName = resolveDisplayName(modelName);
    return {
      id: LocalProviderEntry.ID,
      name: `Local · ${displayName}`,
      displayName,
      type: 'openai',
      endpoint: `http://127.0.0.1:${port || LocalProviderEntry.FALLBACK_PORT}`,
      apiKey: '',
      selectedModel: modelName,
      models: [{ id: modelName }],
      managedByCore: true,
      managedBy: LocalProviderEntry.MANAGED_BY,
      managedRuntimeId: defaults.runtimeId,
    };
  }

  static queueKey(entry) {
    return entry && entry.selectedModel ? `${entry.id}::${entry.selectedModel}` : null;
  }
}

module.exports = LocalProviderEntry;
