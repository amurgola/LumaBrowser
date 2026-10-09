const CitationTag = require('./CitationTag');
const ExcerptWindow = require('./ExcerptWindow');
const TermMatcher = require('./TermMatcher');

class SourceCardBuilder {
  static RELEVANCE_DECIMALS = 3;

  static build(passages, terms) {
    const matcher = new TermMatcher(terms);
    return (passages || []).map((passage, position) => SourceCardBuilder._card(passage, position, matcher));
  }

  static _card(passage, position, matcher) {
    return {
      ref: CitationTag.at(position),
      document: { id: passage.docId, name: passage.filename || null },
      passage: SourceCardBuilder._location(passage),
      relevance: SourceCardBuilder._rounded(passage.relevance),
      excerpt: ExcerptWindow.cut(passage.text, matcher.spans(passage.text)),
    };
  }

  static _location(passage) {
    return { id: passage.id, page: passage.page ?? null, start: passage.charStart ?? null, end: passage.charEnd ?? null };
  }

  static _rounded(relevance) {
    const value = Number(relevance);
    return Number.isFinite(value) ? Number(value.toFixed(SourceCardBuilder.RELEVANCE_DECIMALS)) : 0;
  }
}

module.exports = SourceCardBuilder;
