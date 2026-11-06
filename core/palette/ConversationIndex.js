const StoreHandle = require('../database/StoreHandle');
const LexicalMatchExpression = require('../rag/LexicalMatchExpression');
const QueryTermExtractor = require('../rag/QueryTermExtractor');

class ConversationIndex {
  static TABLE = 'llm_messages_fts';
  static ROLES = "('user', 'assistant')";
  static OPEN = '\u0001';
  static CLOSE = '\u0002';
  static SNIPPET_TOKENS = 14;
  static RAW_LIMIT = 400;
  static RECALL_WORDS = new Set([
    'one', 'ones', 'we', 'us', 'our', 'made', 'make', 'did', 'talked', 'talk', 'about', 'chat', 'chats', 'conversation',
    'conversations', 'asked', 'ask', 'said', 'told', 'remember', 'time', 'thing', 'there', 'had', 'were', 'was',
    'some', 'something', 'last', 'week', 'yesterday', 'earlier', 'before', 'find', 'show', 'open',
    'more', 'less', 'better', 'way', 'get', 'stuff', 'help', 'need', 'want', 'like', 'just', 'really',
  ]);

  static DDL = `
    CREATE VIRTUAL TABLE llm_messages_fts USING fts5(content, conversation_id UNINDEXED, tokenize = 'porter unicode61');
    CREATE TRIGGER IF NOT EXISTS llm_messages_fts_ai AFTER INSERT ON llm_messages
      WHEN new.role IN ${ConversationIndex.ROLES} BEGIN
      INSERT INTO llm_messages_fts (rowid, content, conversation_id) VALUES (new.rowid, new.content, new.conversation_id);
    END;
    CREATE TRIGGER IF NOT EXISTS llm_messages_fts_ad AFTER DELETE ON llm_messages BEGIN
      DELETE FROM llm_messages_fts WHERE rowid = old.rowid;
    END;
    CREATE TRIGGER IF NOT EXISTS llm_messages_fts_au AFTER UPDATE OF content ON llm_messages
      WHEN new.role IN ${ConversationIndex.ROLES} AND new.content IS NOT old.content BEGIN
      DELETE FROM llm_messages_fts WHERE rowid = old.rowid;
      INSERT INTO llm_messages_fts (rowid, content, conversation_id) VALUES (new.rowid, new.content, new.conversation_id);
    END;
  `;

  static BACKFILL = `
    INSERT INTO llm_messages_fts (rowid, content, conversation_id)
    SELECT rowid, content, conversation_id FROM llm_messages WHERE role IN ${ConversationIndex.ROLES}`;

  constructor(settingsDb) {
    this._db = StoreHandle.requireOpen(settingsDb, 'ConversationIndex');
    this._ready = false;
  }

  ensure() {
    if (this._ready) return 0;
    const exists = this._db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(ConversationIndex.TABLE);
    let indexed = 0;
    if (!exists) {
      this._db.transaction(() => {
        this._db.exec(ConversationIndex.DDL);
        indexed = this._db.prepare(ConversationIndex.BACKFILL).run().changes;
      })();
    }
    this._ready = true;
    this._query = this._db.prepare(`
      SELECT f.conversation_id AS conversationId, bm25(llm_messages_fts) AS score,
             snippet(llm_messages_fts, 0, ?, ?, ' ... ', ?) AS snippet
      FROM llm_messages_fts f WHERE llm_messages_fts MATCH ? ORDER BY score LIMIT ?`);
    return indexed;
  }

  search(text, { limit = 8 } = {}) {
    const expr = ConversationIndex.expression(text);
    if (!expr) return [];
    this.ensure();
    let rows;
    try {
      rows = this._query.all(ConversationIndex.OPEN, ConversationIndex.CLOSE, ConversationIndex.SNIPPET_TOKENS, expr, ConversationIndex.RAW_LIMIT);
    } catch (_) {
      return [];
    }
    return ConversationIndex._grouped(rows).slice(0, Math.max(1, limit));
  }

  static expression(text) {
    const terms = QueryTermExtractor.extract(text).filter((t) => !ConversationIndex.RECALL_WORDS.has(t.word));
    return LexicalMatchExpression.fromTerms(terms);
  }

  static _grouped(rows) {
    const byConv = new Map();
    for (const row of rows) {
      const hit = byConv.get(row.conversationId);
      if (hit) { hit.hits += 1; continue; }
      byConv.set(row.conversationId, { conversationId: row.conversationId, best: -row.score, hits: 1, snippet: ConversationIndex.marked(row.snippet) });
    }
    return [...byConv.values()]
      .map((h) => ({ conversationId: h.conversationId, hits: h.hits, snippet: h.snippet, score: h.best + Math.log2(h.hits) }))
      .sort((a, b) => b.score - a.score);
  }

  static marked(raw) {
    const text = [];
    const marks = [];
    let open = -1;
    let length = 0;
    for (const ch of String(raw || '').replace(/\s+/g, ' ')) {
      if (ch === ConversationIndex.OPEN) { open = length; continue; }
      if (ch === ConversationIndex.CLOSE) { if (open >= 0) marks.push([open, length]); open = -1; continue; }
      text.push(ch);
      length += ch.length;
    }
    return { text: text.join('').trim() ? text.join('') : '', marks };
  }
}

module.exports = ConversationIndex;
