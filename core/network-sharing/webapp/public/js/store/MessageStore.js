import StoreRecords from './StoreRecords.js';

export default class MessageStore {
  constructor(repo) {
    this._repo = repo;
  }

  async list(conversationId) {
    const conv = await this._repo.run([StoreRecords.CONVERSATIONS], 'readonly', (db) => db.get(StoreRecords.CONVERSATIONS, conversationId));
    return (conv && conv.messages) || [];
  }

  add(conversationId, msg) {
    return this._repo.run([StoreRecords.CONVERSATIONS], 'readwrite', async (db) => {
      const conv = (await db.get(StoreRecords.CONVERSATIONS, conversationId)) || StoreRecords.blankConversation({ id: conversationId });
      const full = { id: StoreRecords.newId('m'), conversationId: conv.id, createdAt: StoreRecords.now(), ...msg };
      conv.messages.push(full);
      conv.updatedAt = StoreRecords.now();
      MessageStore._seedTitle(conv, full);
      MessageStore._trackModel(conv, full);
      await db.put(StoreRecords.CONVERSATIONS, conv);
      return full;
    });
  }

  update(conversationId, messageId, patch) {
    return this._edit(conversationId, (conv) => {
      const m = (conv.messages || []).find((x) => x.id === messageId);
      if (!m) return { skip: true, result: null };
      Object.assign(m, patch);
      return { result: m };
    });
  }

  delete(conversationId, messageId) {
    return this._edit(conversationId, (conv) => {
      conv.messages = (conv.messages || []).filter((x) => x.id !== messageId);
      return {};
    });
  }

  clear(conversationId) {
    return this._edit(conversationId, (conv) => {
      conv.messages = [];
      return {};
    });
  }

  truncateFrom(conversationId, messageId) {
    return this._edit(conversationId, (conv) => {
      const i = (conv.messages || []).findIndex((m) => m.id === messageId);
      if (i < 0) return { skip: true };
      conv.messages = conv.messages.slice(0, i);
      return {};
    });
  }

  _edit(conversationId, mutate) {
    return this._repo.run([StoreRecords.CONVERSATIONS], 'readwrite', async (db) => {
      const conv = await db.get(StoreRecords.CONVERSATIONS, conversationId);
      if (!conv) return null;
      const { result = undefined, skip = false } = mutate(conv);
      if (skip) return result;
      conv.updatedAt = StoreRecords.now();
      await db.put(StoreRecords.CONVERSATIONS, conv);
      return result;
    });
  }

  static _seedTitle(conv, msg) {
    if ((conv.title === StoreRecords.NEW_TITLE || !conv.title) && msg.role === 'user' && msg.content) {
      conv.title = StoreRecords.titleFrom(msg.content) || conv.title;
    }
  }

  static _trackModel(conv, msg) {
    if (msg.role === 'assistant' && msg.modelRef) {
      conv.modelRef = msg.modelRef;
      conv.provider = msg.provider || conv.provider;
    }
  }
}
