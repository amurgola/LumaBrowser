const QueryTermExtractor = require('./QueryTermExtractor');

class LexicalMatchExpression {
  static ANY_OF = ' OR ';

  static fromText(text) {
    return LexicalMatchExpression.fromTerms(QueryTermExtractor.extract(text));
  }

  static fromTerms(terms) {
    return (terms || []).map((term) => LexicalMatchExpression._operand(term)).join(LexicalMatchExpression.ANY_OF);
  }

  static _operand(term) {
    return term.prefix ? `${term.stem}*` : term.word;
  }
}

module.exports = LexicalMatchExpression;
