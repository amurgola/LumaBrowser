const ChatModelRef = require('./ChatModelRef');
const ProviderConfigService = require('../../../llm-service/ProviderConfigService');
const StoredProviderConfigs = require('../../../llm-service/service/StoredProviderConfigs');

class ChatModelList {
  static HOST_LOCAL_PREFIX = 'Local · ';

  constructor({ llmServerService, db }) {
    this._service = llmServerService;
    this._db = db;
  }

  list() {
    const models = this._withProfiles([...this._localModels(), ...this._helperModels(), ...this._remoteModels()]);
    return { models, defaultRef: this._defaultRef(models) };
  }

  resolveRef(modelRef) {
    return modelRef || this._lastRef() || this.list().defaultRef || null;
  }

  _localModels() {
    const entry = this._service.computeLocalProviderEntry ? this._service.computeLocalProviderEntry() : null;
    if (!entry) return [];
    const others = (entry.models || []).filter((model) => model && model.id && model.id !== entry.selectedModel);
    return [this._currentLocal(entry), ...others.map((model) => this._otherLocal(ChatModelRef.LOCAL_PREFIX + model.id, model.luma_label))];
  }

  _currentLocal(entry) {
    const status = this._service.runtimeServer.getStatus();
    const label = entry.displayName || entry.selectedModel;
    return {
      ref: ChatModelRef.LOCAL_PREFIX + entry.selectedModel,
      label: `Local · ${label}`,
      displayName: label,
      providerId: 'local',
      providerType: 'openai',
      isLocal: true,
      current: true,
      runtimeId: entry.managedRuntimeId || null,
      ready: status.state === 'ready',
      serverState: status.state,
    };
  }

  _helperModels() {
    const helper = this._service && this._service.helperModel;
    if (!helper || typeof helper.readyRef !== 'function') return [];
    let ref = null;
    try { ref = helper.readyRef(); } catch (_) { return []; }
    if (!ref) return [];
    const stem = ChatModelRef.helperName(ref);
    return [{
      ref,
      label: `Helper · ${stem}`,
      displayName: stem,
      providerId: 'helper',
      providerType: 'openai',
      isLocal: false,
      isHelper: true,
      role: 'helper',
      ready: true,
      serverState: 'ready',
    }];
  }

  _remoteModels() {
    const out = [];
    for (const config of this._db.get('llm.providerConfigs', []) || []) {
      if (!config || config.managedByCore || !config.endpoint) continue;
      for (const model of ChatModelList._modelsOf(config)) out.push(ChatModelList._remoteRow(config, model));
    }
    return out;
  }

  _withProfiles(models) {
    const settings = this._service.modelSettings;
    const profiles = settings ? settings.listProfiles() : [];
    if (!profiles.length) return models;
    const out = [];
    for (const m of models) out.push(m, ...profiles.filter((p) => p.baseRef === m.ref).map((p) => ChatModelList._profileRow(p, m)));
    for (const p of profiles) {
      if (ChatModelRef.isLocal(p.baseRef) && !models.some((m) => m.ref === p.baseRef)) out.push(ChatModelList._profileRow(p, this._otherLocal(p.baseRef)));
    }
    return out;
  }

  _otherLocal(ref, entryLabel = null) {
    const stem = ChatModelRef.localName(ref);
    const label = ChatModelList._withoutLocalPrefix(entryLabel)
      || (this._service.resolveModelDisplayName && this._service.resolveModelDisplayName(stem)) || stem;
    return { ref, label: `Local · ${label}`, displayName: label, providerId: 'local', providerType: 'openai', isLocal: true, current: false, ready: false };
  }

  static _withoutLocalPrefix(label) {
    if (typeof label !== 'string' || !label.trim()) return '';
    return label.startsWith(ChatModelList.HOST_LOCAL_PREFIX) ? label.slice(ChatModelList.HOST_LOCAL_PREFIX.length) : label;
  }

  static _profileRow(profile, base) {
    return {
      ...base,
      ref: ChatModelRef.profileRef(profile.id),
      label: `${base.label} · ${profile.name}`,
      isProfile: true,
      profileId: profile.id,
      profileName: profile.name,
      baseRef: base.ref,
    };
  }

  static _modelsOf(config) {
    const models = (Array.isArray(config.models) && config.models.length)
      ? config.models
      : (config.selectedModel ? [{ id: config.selectedModel }] : []);
    const seen = new Set();
    return models.filter((model) => model && model.id && !seen.has(model.id) && seen.add(model.id));
  }

  static _remoteRow(config, model) {
    return {
      ref: `${config.id}::${model.id}`,
      label: `${config.name || config.type}: ${ChatModelList._remoteName(model)}`,
      providerId: config.id,
      providerType: config.type,
      isLocal: false,
      ready: true,
      ...(config.peerManaged === true ? { peer: true } : {}),
      ...(model.luma_kind === 'helper' ? { role: 'helper' } : {}),
    };
  }

  static _remoteName(model) {
    return ChatModelList._withoutLocalPrefix(typeof model.luma_label === 'string' ? model.luma_label.trim() : '') || model.id;
  }

  _defaultRef(models) {
    const last = this._lastRef();
    if (last && models.some((m) => m.ref === last && ChatModelList.canStand(m))) return last;
    const preferred = this._defaultProviderRef(models);
    if (preferred) return preferred;
    return models.length ? models[0].ref : null;
  }

  static canStand(row) {
    return !(row.current === false && !row.isProfile);
  }

  _defaultProviderRef(models) {
    const key = this._db.get(ProviderConfigService.DEFAULT_PROVIDER_KEY, ProviderConfigService.NO_PROVIDER);
    if (!key || key === ProviderConfigService.NO_PROVIDER) return null;
    if (key === ProviderConfigService.MANAGED_LOCAL_ID) {
      const local = models.find((m) => m.isLocal);
      return local ? local.ref : null;
    }
    const config = this._configForDefault(key);
    const modelId = config ? StoredProviderConfigs.defaultModelOf(config) : null;
    const ref = modelId ? `${config.id}::${modelId}` : null;
    return ref && models.some((m) => m.ref === ref) ? ref : null;
  }

  _configForDefault(key) {
    const configs = StoredProviderConfigs.userConfigs(this._db);
    if (StoredProviderConfigs.TYPE_KEYS.has(key)) return configs.find((c) => c && c.type === key && c.endpoint && c.selectedModel) || null;
    return StoredProviderConfigs.findById(this._db, key);
  }

  _lastRef() {
    return this._service.getLastModelRef ? this._service.getLastModelRef() : null;
  }
}

module.exports = ChatModelList;
