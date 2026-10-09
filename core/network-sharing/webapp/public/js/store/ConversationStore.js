import StoreRecords from './StoreRecords.js';

export default class ConversationStore {
  constructor(repo) {
    this._repo = repo;
  }

  async list() {
    const all = await this._repo.run([StoreRecords.CONVERSATIONS], 'readonly', (db) => db.getAll(StoreRecords.CONVERSATIONS));
    return (all || []).filter((c) => !c.archived).sort(ConversationStore._byPinThenRecency);
  }

  get(id) {
    return this._repo.run([StoreRecords.CONVERSATIONS], 'readonly', (db) => db.get(StoreRecords.CONVERSATIONS, id));
  }

  async create(data) {
    const conv = StoreRecords.blankConversation({ mode: data && data.mode });
    await this._repo.run([StoreRecords.CONVERSATIONS], 'readwrite', (db) => db.put(StoreRecords.CONVERSATIONS, conv));
    return conv;
  }

  patch(id, patch) {
    return this._repo.run([StoreRecords.CONVERSATIONS], 'readwrite', async (db) => {
      const conv = await db.get(StoreRecords.CONVERSATIONS, id);
      if (!conv) return null;
      Object.assign(conv, patch);
      if (!('updatedAt' in patch)) conv.updatedAt = StoreRecords.now();
      await db.put(StoreRecords.CONVERSATIONS, conv);
      return conv;
    });
  }

  async delete(id) {
    await this._repo.run([StoreRecords.CONVERSATIONS, StoreRecords.ARTIFACTS], 'readwrite', async (db) => {
      await db.delete(StoreRecords.CONVERSATIONS, id);
      const keys = await db.getAllKeysByIndex(StoreRecords.ARTIFACTS, 'conversationId', id);
      for (const key of keys || []) await db.delete(StoreRecords.ARTIFACTS, key);
    });
  }

  static _byPinThenRecency(a, b) {
    const pin = b.pinned === a.pinned ? 0 : b.pinned ? 1 : -1;
    return pin || String(b.updatedAt).localeCompare(String(a.updatedAt));
  }
}
