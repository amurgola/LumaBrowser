const PaletteMatcher = require('../PaletteMatcher');

class ConversationProvider {
  static TITLE_LIMIT = 1000;
  static FTS_SCALE = 6;

  constructor({ getChatStore, index }) {
    this._getChatStore = getChatStore;
    this._index = index;
  }

  search(query, { limit = 6 } = {}) {
    const store = this._getChatStore();
    if (!store) return [];
    const byId = new Map();
    for (const conv of store.listConversations({ includeArchived: true, limit: ConversationProvider.TITLE_LIMIT })) {
      const m = PaletteMatcher.score(query, [{ text: conv.title, weight: 1 }]);
      if (m) byId.set(conv.id, { conv, score: m.score, marks: m.marks, snippet: null });
    }
    for (const hit of this._index.search(query, { limit: limit * 3 })) {
      const score = ConversationProvider.ftsScore(hit.score);
      const had = byId.get(hit.conversationId);
      if (had) {
        had.score = Math.max(had.score, score) + 0.15;
        had.snippet = hit.snippet;
        continue;
      }
      const conv = store.getConversation(hit.conversationId);
      if (conv && !conv.hidden) byId.set(conv.id, { conv, score, marks: [], snippet: hit.snippet });
    }
    return [...byId.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((h) => ConversationProvider.item(h.conv, h));
  }

  static ftsScore(bm25) {
    return 0.35 + 0.75 * (1 - Math.exp(-Math.max(0, bm25) / ConversationProvider.FTS_SCALE));
  }

  static item(conv, { score = 0, marks = [], snippet = null } = {}) {
    return {
      kind: 'conversation',
      id: conv.id,
      title: conv.title || 'Untitled chat',
      subtitle: snippet && snippet.text ? snippet.text : ConversationProvider.when(conv.updatedAt),
      subtitleMarks: snippet ? snippet.marks : [],
      tag: conv.archived ? 'Archived' : '',
      marks,
      score,
    };
  }

  static when(iso) {
    const t = Date.parse(iso || '');
    if (!Number.isFinite(t)) return 'Conversation';
    return `Conversation, ${new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}

module.exports = ConversationProvider;
