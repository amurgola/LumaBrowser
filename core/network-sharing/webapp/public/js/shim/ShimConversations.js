import ArtifactViewUrl from './ArtifactViewUrl.js';
import StoreRecords from '../store/StoreRecords.js';

export default class ShimConversations {
  constructor(store) {
    this._store = store;
  }

  surface() {
    const s = this._store;
    const ok = ShimConversations._ok;
    const done = ShimConversations._done;
    return {
      list: async () => ok('conversations', await s.conversations.list()),
      get: async (id) => ok('conversation', await s.conversations.get(id)),
      create: async (data) => ok('conversation', await s.conversations.create(data)),
      rename: (id, title) => done(s.conversations.patch(id, { title })),
      delete: (id) => done(s.conversations.delete(id)),
      pin: (id, pinned) => done(s.conversations.patch(id, { pinned: !!pinned })),
      archive: (id, archived) => done(s.conversations.patch(id, { archived: !!archived })),
      messages: async (id) => ok('messages', await s.messages.list(id)),
      addMessage: async (msg) => ok('message', await s.messages.add(msg.conversationId, msg)),
      deleteMessage: (id, messageId) => done(s.messages.delete(id, messageId)),
      updateMessage: (messageId, patch) => this.updateMessage(messageId, patch),
      clearMessages: (id) => done(s.messages.clear(id)),
      search: (q) => this.search(q),
      autotitle: (id) => this.autotitle(id),
      setTools: (id, enabled) => done(s.conversations.patch(id, { toolsEnabled: !!enabled })),
      setReasoningEffort: (id, position) => done(s.conversations.patch(id, { reasoningEffort: position || null })),
      setVariant: async () => ({ success: true }),
      variants: async () => ok('variants', []),
      artifacts: (id) => this.artifacts(id),
      meta: { get: (id) => this.getMeta(id), set: (id, patch) => this.setMeta(id, patch) },
    };
  }

  async updateMessage(messageId, patch) {
    const cid = patch && patch.conversationId;
    if (!cid || typeof patch.content !== 'string') return { success: false, error: 'content required' };
    const m = await this._store.messages.update(cid, messageId, { content: patch.content });
    return { success: !!m };
  }

  async search(q) {
    const needle = String(q || '').toLowerCase();
    const all = await this._store.conversations.list();
    return ShimConversations._ok('conversations', all.filter((c) => String(c.title || '').toLowerCase().includes(needle)));
  }

  async autotitle(id) {
    const c = await this._store.conversations.get(id);
    const firstUser = c && (c.messages || []).find((m) => m.role === 'user' && m.content);
    if (!firstUser) return { success: true };
    const title = StoreRecords.titleFrom(firstUser.content);
    await this._store.conversations.patch(id, { title });
    return { success: true, title };
  }

  async artifacts(id) {
    const list = await this._store.artifacts.list(id);
    return ShimConversations._ok('artifacts', list.map((a) => ({ url: ArtifactViewUrl.of(a.id), ...a })));
  }

  async getMeta(id) {
    const c = await this._store.conversations.get(id);
    return ShimConversations._ok('meta', (c && c.meta) || { mode: (c && c.mode) || 'chat', data: {} });
  }

  async setMeta(id, patch) {
    const c = await this._store.conversations.get(id);
    await this._store.conversations.patch(id, { meta: { ...(c && c.meta), ...patch } });
    return { success: true };
  }

  static _ok(key, value) {
    return { success: true, [key]: value };
  }

  static async _done(promise) {
    await promise;
    return { success: true };
  }
}
