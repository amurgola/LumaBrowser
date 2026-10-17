const JsonCollectionStore = require('../../database/JsonCollectionStore');
const ModelOverrides = require('../../shared/llm/ModelOverrides');
const ChatModelRef = require('../chat/router/ChatModelRef');

class ModelProfileStore extends JsonCollectionStore {
  static STORAGE_KEY = 'core.llmServer.modelProfiles';
  static MAX_NAME_LENGTH = 60;

  constructor(settingsDb) {
    super(settingsDb, { storageKey: ModelProfileStore.STORAGE_KEY, entity: 'profile' });
  }

  listFor(baseRef) {
    return this.list().filter((profile) => profile.baseRef === baseRef);
  }

  create(input = {}) {
    const baseRef = ModelProfileStore._baseRef(input.baseRef);
    const name = this._validName(input.name, baseRef, null);
    const now = Date.now();
    return this._add({
      id: this._slugId(name),
      name,
      baseRef,
      overrides: ModelOverrides.clean(input.overrides),
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id, patch = {}) {
    const current = { ...(this.get(id) || {}) };
    if (!current.id) throw new Error('Model profile not found');
    if (patch.name != null) current.name = this._validName(patch.name, current.baseRef, id);
    if (patch.overrides !== undefined) current.overrides = ModelOverrides.clean(patch.overrides);
    current.updatedAt = Date.now();
    return this._put(id, current);
  }

  static _baseRef(raw) {
    const baseRef = typeof raw === 'string' ? raw.trim() : '';
    if (!baseRef || !baseRef.includes(ChatModelRef.SEPARATOR)) throw new Error('A profile needs a base model');
    if (ChatModelRef.isProfile(baseRef)) throw new Error('A profile cannot be based on another profile');
    return baseRef;
  }

  _validName(raw, baseRef, exceptId) {
    const name = String(raw == null ? '' : raw).trim().slice(0, ModelProfileStore.MAX_NAME_LENGTH);
    if (!name) throw new Error('Profile name is required');
    const key = name.toLowerCase();
    const taken = this.listFor(baseRef).some((p) => p.id !== exceptId && String(p.name).trim().toLowerCase() === key);
    if (taken) throw new Error(`This model already has a profile named "${name}"`);
    return name;
  }
}

module.exports = ModelProfileStore;
