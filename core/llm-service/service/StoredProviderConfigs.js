const ProviderConfigService = require('../ProviderConfigService');

class StoredProviderConfigs {
  static TYPE_KEYS = new Set([ProviderConfigService.NO_PROVIDER, 'openai', 'anthropic']);

  static userConfigs(db) {
    const stored = db.get(ProviderConfigService.PROVIDER_CONFIGS_KEY, []) || [];
    return stored.filter((config) => !config || !config.managedByCore);
  }

  static findById(db, id) {
    if (!id || StoredProviderConfigs.TYPE_KEYS.has(id)) return null;
    return StoredProviderConfigs.userConfigs(db).find((c) => c && c.id === id && c.endpoint) || null;
  }

  static defaultModelOf(config) {
    if (config.selectedModel) return config.selectedModel;
    const first = Array.isArray(config.models) ? config.models[0] : null;
    return (first && first.id) || null;
  }
}

module.exports = StoredProviderConfigs;
