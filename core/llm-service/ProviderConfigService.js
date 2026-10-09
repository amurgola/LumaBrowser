class ProviderConfigService {
  static DEFAULT_PROVIDER_KEY = 'llm.provider';
  static PROVIDER_CONFIGS_KEY = 'llm.providerConfigs';
  static NO_PROVIDER = 'none';
  static MANAGED_LOCAL_ID = 'core.llmServer.local';
  static REMOVED_PROVIDERS = new Set(['webgpu']);

  constructor({ db, lmStudioService, anthropicService, llmServerService = null }) {
    this._db = db;
    this._providersByType = { openai: lmStudioService, anthropic: anthropicService };
    this._llmServerService = llmServerService;
  }

  getDefaultProvider() {
    const provider = this._db.get(ProviderConfigService.DEFAULT_PROVIDER_KEY, ProviderConfigService.NO_PROVIDER);
    if (!ProviderConfigService.REMOVED_PROVIDERS.has(provider)) return provider;
    this._db.set(ProviderConfigService.DEFAULT_PROVIDER_KEY, ProviderConfigService.NO_PROVIDER);
    return ProviderConfigService.NO_PROVIDER;
  }

  setDefaultProvider(provider) {
    if (provider !== undefined) this._db.set(ProviderConfigService.DEFAULT_PROVIDER_KEY, provider);
  }

  static applyProviderSettings(provider, config) {
    if (config.endpoint !== undefined) provider.setEndpoint(config.endpoint);
    if (config.selectedModel !== undefined) provider.setSelectedModel(config.selectedModel);
    if (config.apiKey !== undefined) provider.setApiKey(config.apiKey);
    if (config.models) provider.setModels(config.models);
  }

  probeModels(provider, endpoint, apiKey) {
    return provider.withTemporaryConfig({ endpoint, apiKey }, () => provider.fetchModels());
  }

  async probeModelsForType(type, endpoint, apiKey) {
    const provider = this._providerForType(type);
    if (!provider) return { success: false, error: 'Unknown provider type' };
    return this.probeModels(provider, endpoint, apiKey);
  }

  listProviderConfigs() {
    const stored = ProviderConfigService._userConfigs(this._db.get(ProviderConfigService.PROVIDER_CONFIGS_KEY, []));
    const local = this._localProviderEntry();
    return local ? [...stored, local] : stored;
  }

  saveProviderConfigs(configs) {
    const persisted = ProviderConfigService._userConfigs(configs);
    this._db.set(ProviderConfigService.PROVIDER_CONFIGS_KEY, persisted);
    const firstByType = this._syncSingleProviderConfigs(persisted);
    this._resolveDefaultProvider(persisted, firstByType);
  }

  _providerForType(type) {
    return Object.hasOwn(this._providersByType, type) ? this._providersByType[type] : null;
  }

  _localProviderEntry() {
    const service = this._llmServerService;
    return service && service.computeLocalProviderEntry ? service.computeLocalProviderEntry() : null;
  }

  _syncSingleProviderConfigs(configs) {
    const firstByType = {};
    for (const type of Object.keys(this._providersByType)) {
      firstByType[type] = configs.find((c) => c.type === type && c.endpoint && c.selectedModel) || null;
      if (firstByType[type]) ProviderConfigService._syncProvider(this._providersByType[type], firstByType[type]);
    }
    return firstByType;
  }

  static _syncProvider(provider, config) {
    provider.setEndpoint(config.endpoint);
    provider.setSelectedModel(config.selectedModel);
    provider.setApiKey(config.apiKey || null);
    provider.setModels(config.models || []);
  }

  _resolveDefaultProvider(configs, firstByType) {
    const current = this._db.get(ProviderConfigService.DEFAULT_PROVIDER_KEY, ProviderConfigService.NO_PROVIDER);
    if (ProviderConfigService._defaultStillResolves(current, configs, firstByType)) return;
    const fallback = Object.keys(firstByType).find((type) => firstByType[type]) || ProviderConfigService.NO_PROVIDER;
    this._db.set(ProviderConfigService.DEFAULT_PROVIDER_KEY, fallback);
  }

  static _defaultStillResolves(current, configs, firstByType) {
    if (Object.hasOwn(firstByType, current) && firstByType[current]) return true;
    if (current === ProviderConfigService.MANAGED_LOCAL_ID) return true;
    return configs.some((config) => config && config.id === current);
  }

  static _userConfigs(configs) {
    return (configs || []).filter((config) => !config || !config.managedByCore);
  }
}

module.exports = ProviderConfigService;
