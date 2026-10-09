const RagEmbedder = require('./RagEmbedder');
const EmbeddingVector = require('./EmbeddingVector');
const QueryTermExtractor = require('./QueryTermExtractor');
const TermMatcher = require('./TermMatcher');
const WordTokenizer = require('./WordTokenizer');
const ScoreNormalizer = require('./ScoreNormalizer');
const ConvexScoreFusion = require('./ConvexScoreFusion');
const DiversitySelector = require('./DiversitySelector');

class KnowledgeRetriever {
  static DEFAULT_LIMIT = 5;
  static POOL_PER_RESULT = 8;
  static COVERAGE_WEIGHT = 0.5;
  static COSINE_FLOOR = 0.2;

  static retrieve(store, scope, query, limit = KnowledgeRetriever.DEFAULT_LIMIT) {
    return new KnowledgeRetriever(store).execute(scope, query, limit);
  }

  constructor(store) {
    this._store = store;
  }

  async execute(scope, query, limit) {
    this._prepare(scope, query, limit);
    this._gatherLexicalEvidence();
    await this._gatherDenseEvidence();
    this._blendEvidence();
    this._loadCandidates();
    return this._selectPassages();
  }

  _prepare(scope, query, limit) {
    this._scope = scope;
    this._query = query;
    this._limit = limit || KnowledgeRetriever.DEFAULT_LIMIT;
    this._poolSize = this._limit * KnowledgeRetriever.POOL_PER_RESULT;
    this._matcher = new TermMatcher(QueryTermExtractor.extract(query));
    this._dense = new Map();
    this._vectors = new Map();
  }

  _gatherLexicalEvidence() {
    const rows = this._store.findKeywordPassages(this._scope, this._query, this._poolSize);
    const shares = ScoreNormalizer.bm25Shares(rows);
    this._lexical = new Map(rows.map((row) => [row.id, shares.get(row.id) * this._coverageFactor(row.text)]));
  }

  _coverageFactor(text) {
    const weight = KnowledgeRetriever.COVERAGE_WEIGHT;
    return (1 - weight) + weight * this._matcher.coverage(text);
  }

  async _gatherDenseEvidence() {
    if (!RagEmbedder.isConfigured()) return;
    const vectors = await RagEmbedder.embed([this._query]);
    const queryVector = vectors && vectors[0];
    if (!queryVector) return;
    for (const hit of this._denseHits(queryVector).slice(0, this._poolSize)) {
      this._dense.set(hit.id, hit.relevance);
      this._vectors.set(hit.id, hit.vector);
    }
  }

  _denseHits(queryVector) {
    const hits = [];
    for (const candidate of this._store.denseCandidates(this._scope)) {
      const similarity = candidate.embedding ? EmbeddingVector.cosine(queryVector, candidate.embedding) : 0;
      const relevance = ScoreNormalizer.cosineAboveFloor(similarity, KnowledgeRetriever.COSINE_FLOOR);
      if (relevance !== null) hits.push({ id: candidate.id, relevance, vector: candidate.embedding });
    }
    return hits.sort((a, b) => b.relevance - a.relevance);
  }

  _blendEvidence() {
    this._ranked = ConvexScoreFusion.blend(this._lexical, this._dense).slice(0, this._poolSize);
  }

  _loadCandidates() {
    const rows = new Map(this._store.getChunks(this._ranked.map((hit) => hit.id)).map((row) => [row.id, row]));
    this._candidates = this._ranked
      .filter((hit) => rows.has(hit.id))
      .map((hit) => this._candidate(rows.get(hit.id), hit.relevance));
  }

  _candidate(row, relevance) {
    return {
      row,
      docId: row.docId,
      relevance,
      vector: this._vectors.get(row.id) || null,
      words: WordTokenizer.foldedSet(row.text),
    };
  }

  _selectPassages() {
    return DiversitySelector.select(this._candidates, this._limit)
      .map((candidate) => ({ ...KnowledgeRetriever._passageFields(candidate.row), relevance: candidate.relevance }));
  }

  static _passageFields(row) {
    return {
      id: row.id,
      docId: row.docId,
      filename: row.filename || null,
      page: row.page ?? null,
      text: row.text,
      charStart: row.charStart ?? null,
      charEnd: row.charEnd ?? null,
    };
  }
}

module.exports = KnowledgeRetriever;
