const ShellToken = require('./ShellToken');

class WordReader {
  constructor(syntax, scanner) {
    this._syntax = syntax;
    this._scanner = scanner;
  }

  read(cursor) {
    const start = cursor.position;
    let text = '';
    let quoted = false;
    while (!cursor.atEnd) {
      const piece = this._scanner.readPiece(cursor);
      if (piece) {
        text += piece.text;
        quoted = quoted || piece.quoted;
      } else if (this._syntax.endsWord(cursor.peek())) {
        break;
      } else {
        text += cursor.take();
      }
    }
    if (!text && !quoted) return null;
    return ShellToken.word(text, cursor.sliceFrom(start), quoted, start, cursor.position);
  }
}

module.exports = WordReader;
