const PassageCitationRenderer = require('./PassageCitationRenderer');
const SourceCardBuilder = require('./SourceCardBuilder');

class KnowledgeLookupOutcome {
  static BLANK = 'Nothing to look up: pass the words or question to find in the user\'s documents as "query".';

  static blank() {
    return KnowledgeLookupOutcome._empty(KnowledgeLookupOutcome.BLANK);
  }

  static of(query, passages, terms) {
    if (!passages || passages.length === 0) return KnowledgeLookupOutcome._miss(query);
    return KnowledgeLookupOutcome._hit(passages, terms);
  }

  static _miss(query) {
    return KnowledgeLookupOutcome._empty(`The user's documents have nothing matching "${query}". Try once more with `
      + 'other key words, or tell the user their documents do not cover it.');
  }

  static _hit(passages, terms) {
    const rendered = PassageCitationRenderer.render(passages);
    return {
      found: true,
      rendered,
      sources: SourceCardBuilder.build(passages, terms),
      message: `${KnowledgeLookupOutcome._lead(passages.length)}\n${rendered}`,
    };
  }

  static _lead(count) {
    const noun = count === 1 ? 'passage' : 'passages';
    return `${count} ${noun} from the user's documents, most relevant first. Answer from them and put the tag of `
      + 'each passage you use right after the fact, like [S1].';
  }

  static _empty(message) {
    return { found: false, rendered: '', sources: [], message };
  }
}

module.exports = KnowledgeLookupOutcome;
