class OperatorReader {
  constructor(syntax) {
    this._all = syntax.operators;
    this._redirects = syntax.operators.filter((operator) => operator.kind === 'redirect');
  }

  read(cursor) {
    return OperatorReader._match(cursor, this._all);
  }

  opensRedirect(cursor) {
    return this._redirects.some((operator) => cursor.startsWith(operator.op));
  }

  readRedirect(cursor) {
    return OperatorReader._match(cursor, this._redirects);
  }

  static _match(cursor, candidates) {
    const found = candidates.find((operator) => cursor.startsWith(operator.op));
    if (!found) return null;
    cursor.take(found.op.length);
    return found;
  }
}

module.exports = OperatorReader;
