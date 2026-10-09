const ChatModelRef = require('./ChatModelRef');

class ChatModelList {
  constructor({ llmServerService, db }) {
    this._service = llmServerService;
    this._db = db;
  }

  list() {
    const models = [...this._localModels(), ...this._remoteModels()];
    return { models, defaultRef: this._defaultRef(models) };
  }

  resolveRef(modelRef) {
    return modelRef || this._lastRef() || this.list().defaultRef || null;
  }

  _localModels() {
    const entry = this._service.computeLocalProviderEntry ? this._service.computeLocalProviderEntry() : null;
    if (!entry) return [];
    const status = this._service.runtimeServer.getStatus();
    const label = entry.displayName || entry.selectedModel;
    return [{
      ref: ChatModelRef.LOCAL_PREFIX + entry.selectedModel,
      label: `Local · ${label}`,
      displayName: label,
      providerId: 'local',
      providerType: 'openai',
      isLocal: true,
      runtimeId: entry.managedRuntimeId || null,
      ready: status.state === 'ready',
      serverState: status.state,
    }];
  }

  _remoteModels() {
    const out = [];
    for (const config of this._db.get('llm.providerConfigs', []) || []) {
      if (!config || config.managedByCore || !config.endpoint) continue;
      for (const modelId of ChatModelList._modelIdsOf(config)) out.push(ChatModelList._remoteRow(config, modelId));
    }
    return out;
  }

  static _modelIdsOf(config) {
    const ids = (Array.isArray(config.models) && config.models.length)
      ? config.models.map((m) => m.id)
      : (config.selectedModel ? [config.selectedModel] : []);
    return [...new Set(ids.filter(Boolean))];
  }

  static _remoteRow(config, modelId) {
    return {
      ref: `${config.id}::${modelId}`,
      label: `${config.name || config.type}: ${modelId}`,
      providerId: config.id,
      providerType: config.type,
      isLocal: false,
      ready: true,
    };
  }

  _defaultRef(models) {
    const last = this._lastRef();
    if (last && models.some((m) => m.ref === last)) return last;
    return models.length ? models[0].ref : null;
  }

  _lastRef() {
    return this._service.getLastModelRef ? this._service.getLastModelRef() : null;
  }
}

module.exports = ChatModelList;
