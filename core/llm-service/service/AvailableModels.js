const StoredProviderConfigs = require('./StoredProviderConfigs');

class AvailableModels {
  static TYPE_LABELS = Object.freeze({ openai: 'OpenAI-Compatible', anthropic: 'Anthropic' });

  static labelFor(type) {
    return Object.hasOwn(AvailableModels.TYPE_LABELS, type) ? AvailableModels.TYPE_LABELS[type] : type;
  }

  static list({ db, providers, managedEntries = [] }) {
    const configs = [...StoredProviderConfigs.userConfigs(db), ...managedEntries].filter(Boolean);
    const models = AvailableModels._fromConfigs(configs);
    return models.length > 0 ? models : AvailableModels._fromSingleProviders(db, providers);
  }

  static _fromConfigs(configs) {
    const models = [];
    const seen = new Set();
    for (const config of configs) {
      if (!config.models || !config.endpoint) continue;
      for (const row of AvailableModels._rowsForConfig(config)) {
        const key = `${row.providerId}::${row.modelId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        models.push(row);
      }
    }
    return models;
  }

  static _rowsForConfig(config) {
    const providerLabel = config.name || AvailableModels.labelFor(config.type);
    const providerId = config.managedByCore ? config.id : config.type;
    return config.models.map((model) => AvailableModels._row(providerId, providerLabel, model.id));
  }

  static _fromSingleProviders(db, providers) {
    const models = [];
    for (const [key, provider] of Object.entries(providers)) {
      if (!provider || !(provider.getEndpoint && provider.getEndpoint())) continue;
      const dbKey = key === 'openai' ? 'lmStudio' : key;
      for (const model of db.get(`${dbKey}.models`, [])) {
        models.push(AvailableModels._row(key, AvailableModels.labelFor(key), model.id));
      }
    }
    return models;
  }

  static _row(providerId, providerLabel, modelId) {
    return { providerId, providerLabel, modelId, label: `${providerLabel}: ${modelId}` };
  }
}

module.exports = AvailableModels;
