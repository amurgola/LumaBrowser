const OpenAICompatibleProvider = require('../providers/OpenAICompatibleProvider');
const AnthropicProvider = require('../providers/AnthropicProvider');
const NonPersistingDb = require('./NonPersistingDb');

class EphemeralProviders {
  constructor(db) {
    this._db = NonPersistingDb.wrap(db);
    this._local = null;
    this._grounding = null;
    this._byConfigId = new Map();
  }

  forManagedLocal(entry, model) {
    if (!this._local) this._local = new OpenAICompatibleProvider(this._db);
    return EphemeralProviders._bindManaged(this._local, entry.endpoint, entry.apiKey || null, model);
  }

  forGrounding(entry) {
    if (!this._grounding) this._grounding = new OpenAICompatibleProvider(this._db);
    return EphemeralProviders._bindManaged(this._grounding, entry.endpoint, null, entry.selectedModel);
  }

  forStoredConfig(config) {
    if (!config || !config.endpoint) return null;
    const provider = this._cachedForConfig(config);
    provider.setEndpoint(config.endpoint);
    provider.setApiKey(config.apiKey || null);
    return provider;
  }

  static _bindManaged(provider, endpoint, apiKey, model) {
    provider.setEndpoint(endpoint);
    provider.setApiKey(apiKey);
    provider.setManagedLocal(true);
    provider.setSelectedModel(model);
    return provider;
  }

  _cachedForConfig(config) {
    let provider = this._byConfigId.get(config.id);
    if (!provider) {
      provider = config.type === 'anthropic' ? new AnthropicProvider(this._db) : new OpenAICompatibleProvider(this._db);
      this._byConfigId.set(config.id, provider);
    }
    return provider;
  }
}

module.exports = EphemeralProviders;
