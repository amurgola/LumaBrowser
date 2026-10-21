const ChatModelRef = require('../chat/router/ChatModelRef');
const ModelOverrides = require('../../shared/llm/ModelOverrides');

class ModelSettings {
  constructor({ overrides, profiles, launchFlags, getDefaults, lastModelRef }) {
    this._overrides = overrides;
    this._profiles = profiles;
    this._launchFlags = launchFlags;
    this._getDefaults = getDefaults;
    this._lastRef = lastModelRef;
  }

  resolve(modelRef) {
    if (!ChatModelRef.isProfile(modelRef)) {
      return { ref: modelRef, selectedRef: modelRef, profile: null, settings: this._requestOverrides(modelRef) };
    }
    const profile = this._profiles.get(ChatModelRef.profileId(modelRef));
    if (!profile) throw new Error('The model profile this chat uses was deleted. Pick another model.');
    return {
      ref: profile.baseRef,
      selectedRef: modelRef,
      profile: { id: profile.id, name: profile.name },
      settings: ModelOverrides.merge(this._requestOverrides(profile.baseRef), profile.overrides),
    };
  }

  baseRef(modelRef) {
    if (!ChatModelRef.isProfile(modelRef)) return modelRef || null;
    const profile = this._profiles.get(ChatModelRef.profileId(modelRef));
    return profile ? profile.baseRef : null;
  }

  listProfiles() {
    return this._profiles.list();
  }

  view(modelRef) {
    const baseRef = this.baseRef(modelRef);
    if (!baseRef) return null;
    const profile = ChatModelRef.isProfile(modelRef) ? this._profiles.get(ChatModelRef.profileId(modelRef)) : null;
    const isLocal = ChatModelRef.isLocal(baseRef);
    return {
      selectedRef: modelRef,
      baseRef,
      isLocal,
      defaults: this._globalLayer(isLocal),
      model: { overrides: this._overrides.get(baseRef), launchFlags: isLocal ? this._launchFlags.get(ModelSettings._stem(baseRef)) : '' },
      profile: profile ? { id: profile.id, name: profile.name, overrides: profile.overrides } : null,
      profiles: this._profiles.listFor(baseRef).map((p) => ({ id: p.id, name: p.name, ref: ChatModelRef.profileRef(p.id) })),
    };
  }

  setModel(modelRef, payload = {}) {
    if (!modelRef || ChatModelRef.isProfile(modelRef)) throw new Error('Pick a model, not a profile');
    this._overrides.set(modelRef, payload.overrides);
    if (ChatModelRef.isLocal(modelRef) && payload.launchFlags !== undefined) {
      this._launchFlags.set(ModelSettings._stem(modelRef), payload.launchFlags);
    }
    return this.view(modelRef);
  }

  saveProfile(input = {}) {
    const saved = input.id
      ? this._profiles.update(input.id, { name: input.name, overrides: input.overrides })
      : this._profiles.create(input);
    return { ...saved, ref: ChatModelRef.profileRef(saved.id) };
  }

  deleteProfile(id) {
    const removed = this._profiles.delete(id);
    if (removed && this._lastRef && this._lastRef.get() === ChatModelRef.profileRef(id)) this._lastRef.set(null);
    return removed;
  }

  launchDefaults(defaults) {
    if (!defaults || !defaults.modelPath) return defaults;
    const own = this._overrides.get(ChatModelRef.LOCAL_PREFIX + ModelSettings._pathStem(defaults.modelPath));
    const launch = {};
    for (const field of ModelOverrides.LAUNCH_FIELDS) if (own[field] !== undefined) launch[field] = own[field];
    return ModelOverrides.isEmpty(launch) ? defaults : { ...defaults, ...launch };
  }

  _requestOverrides(baseRef) {
    const own = this._overrides.get(baseRef);
    const out = {};
    for (const field of ModelOverrides.REQUEST_FIELDS) if (own[field] !== undefined) out[field] = own[field];
    return out;
  }

  _globalLayer(isLocal) {
    const d = this._getDefaults() || {};
    return {
      reasoningEffort: d.noThink ? 'off' : (d.reasoningEffort || 'default'),
      temperature: null,
      maxReplyTokens: null,
      maxParallelToolCalls: null,
      ...(isLocal ? { kvCacheType: d.kvCacheType || null } : {}),
    };
  }

  static _stem(localRef) {
    return ChatModelRef.localName(localRef);
  }

  static _pathStem(filePath) {
    const base = String(filePath).replace(/\\/g, '/').split('/').pop() || '';
    return base.replace(/\.[^.]+$/, '');
  }
}

module.exports = ModelSettings;
