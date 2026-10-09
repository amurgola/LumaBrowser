class SlotConfigStore {
  constructor(db) {
    this._db = db;
  }

  explicitConfig(slotId) {
    const provider = this._db.get(SlotConfigStore._key(slotId, 'provider'), '');
    const model = this._db.get(SlotConfigStore._key(slotId, 'model'), '');
    return provider && model ? { provider, model } : null;
  }

  set(slotId, provider, model) {
    this._db.set(SlotConfigStore._key(slotId, 'provider'), provider);
    this._db.set(SlotConfigStore._key(slotId, 'model'), model);
  }

  clear(slotId) {
    this._db.delete(SlotConfigStore._key(slotId, 'provider'));
    this._db.delete(SlotConfigStore._key(slotId, 'model'));
  }

  sessionId(slotId) {
    const key = SlotConfigStore._key(slotId, 'cacheSessionId');
    let id = this._db.get(key, '');
    if (!id) {
      id = SlotConfigStore._newSessionId();
      this._db.set(key, id);
    }
    return id;
  }

  static _key(slotId, field) {
    return `core.llm.slots.${slotId}.${field}`;
  }

  static _newSessionId() {
    return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

module.exports = SlotConfigStore;
