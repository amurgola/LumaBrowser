const ProviderConfigService = require('../ProviderConfigService');
const ManagedServers = require('./ManagedServers');
const StoredProviderConfigs = require('./StoredProviderConfigs');

class SlotResolver {
  static UNRESOLVED = Object.freeze({ provider: null, modelOverride: null });

  constructor({ db, providers, managedServers, ephemeralProviders }) {
    this._db = db;
    this._providers = providers;
    this._managed = managedServers;
    this._ephemeral = ephemeralProviders;
  }

  resolve(config) {
    if (!config || !config.provider) return SlotResolver._unresolved();
    if (config.provider === ManagedServers.LOCAL_ID) return this._resolveManagedLocal(config);
    if (config.provider === ManagedServers.GROUNDING_ID) return this._resolveGrounding();
    const stored = StoredProviderConfigs.findById(this._db, config.provider);
    if (stored) return this._resolveStoredConfig(config, stored);
    return this._resolveStaticProvider(config);
  }

  defaultConfig() {
    const key = this._db.get(ProviderConfigService.DEFAULT_PROVIDER_KEY, ProviderConfigService.NO_PROVIDER);
    if (key === ProviderConfigService.NO_PROVIDER) return null;
    const model = this._defaultModelFor(key);
    return model ? { provider: key, model } : null;
  }

  static _unresolved() {
    return { ...SlotResolver.UNRESOLVED };
  }

  _resolveManagedLocal(config) {
    const entry = this._managed.localEntry();
    if (!entry) return SlotResolver._unresolved();
    const model = config.model || entry.selectedModel;
    return { provider: this._ephemeral.forManagedLocal(entry, model), modelOverride: model || null };
  }

  _resolveGrounding() {
    const entry = this._managed.groundingEntry();
    if (!entry) return SlotResolver._unresolved();
    return { provider: this._ephemeral.forGrounding(entry), modelOverride: entry.selectedModel };
  }

  _resolveStoredConfig(config, stored) {
    const provider = this._ephemeral.forStoredConfig(stored);
    if (!provider) return SlotResolver._unresolved();
    const model = config.model || StoredProviderConfigs.defaultModelOf(stored);
    if (model) provider.setSelectedModel(model);
    return { provider, modelOverride: model || null };
  }

  _resolveStaticProvider(config) {
    const provider = this._staticProvider(config.provider);
    if (!provider) return SlotResolver._unresolved();
    const providerDefault = provider.getSelectedModel ? provider.getSelectedModel() : null;
    const modelOverride = config.model && config.model !== providerDefault ? config.model : null;
    return { provider, modelOverride };
  }

  _defaultModelFor(key) {
    if (key === ManagedServers.LOCAL_ID) return this._localDefaultModel();
    const stored = StoredProviderConfigs.findById(this._db, key);
    if (stored) return StoredProviderConfigs.defaultModelOf(stored);
    const provider = this._staticProvider(key);
    if (!provider || !provider.getSelectedModel) return null;
    return provider.getSelectedModel() || null;
  }

  _localDefaultModel() {
    const entry = this._managed.localEntry();
    return (entry && entry.selectedModel) || null;
  }

  _staticProvider(key) {
    return Object.hasOwn(this._providers, key) ? this._providers[key] || null : null;
  }
}

module.exports = SlotResolver;
