const SettingsMapStore = require('./SettingsMapStore');
const ModelOverrides = require('../../shared/llm/ModelOverrides');
const ChatModelRef = require('../chat/router/ChatModelRef');

class ModelOverrideStore extends SettingsMapStore {
  static STORAGE_KEY = 'core.llmServer.modelOverrides';

  constructor(settingsDb) {
    super(settingsDb, ModelOverrideStore.STORAGE_KEY);
  }

  get(modelRef) {
    if (!modelRef) return {};
    return ModelOverrideStore._clean(modelRef, this._read()[modelRef]);
  }

  set(modelRef, overrides) {
    if (!modelRef || ChatModelRef.isProfile(modelRef)) return {};
    const clean = ModelOverrideStore._clean(modelRef, overrides);
    const entries = this.all();
    if (ModelOverrides.isEmpty(clean)) delete entries[modelRef];
    else entries[modelRef] = clean;
    this._write(entries);
    return clean;
  }

  static _clean(modelRef, overrides) {
    return ModelOverrides.clean(overrides, { launch: ChatModelRef.isLocal(modelRef) });
  }
}

module.exports = ModelOverrideStore;
