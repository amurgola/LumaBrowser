const KnowledgeRetriever = require('./KnowledgeRetriever');
const KnowledgeLookupOutcome = require('./KnowledgeLookupOutcome');
const QueryTermExtractor = require('./QueryTermExtractor');
const RagStore = require('./RagStore');

class KnowledgeLookup {
  static async lookup(store, query, { scope, k } = {}) {
    const request = KnowledgeLookup._request(store, query, scope, k);
    if (!request.text) return KnowledgeLookupOutcome.blank();
    const passages = await KnowledgeRetriever.retrieve(store, request.scope, request.text, request.limit);
    return KnowledgeLookupOutcome.of(request.text, passages, QueryTermExtractor.extract(request.text));
  }

  static _request(store, query, scope, k) {
    return {
      text: String(query || '').trim(),
      scope: scope || (store && store.scope) || RagStore.DEFAULT_SCOPE,
      limit: k || KnowledgeRetriever.DEFAULT_LIMIT,
    };
  }
}

module.exports = KnowledgeLookup;
