const SyntaxCatalog = require('./syntax/SyntaxCatalog');
const SourceCursor = require('./syntax/SourceCursor');
const ShellScanner = require('./syntax/ShellScanner');

class CommandSubstitution {
  static PAREN_OPENERS = Object.freeze(['$(', '<(', '>(']);
  static BACKQUOTE = '`';

  static BACKQUOTE_ESCAPE = /\\([$`\\])/g;

  static extract(value, options = {}) {
    return CommandSubstitution.locate(value, options).map((found) => found.body).filter((body) => body.trim());
  }

  static extractAll(values, options = {}) {
    return values.flatMap((value) => CommandSubstitution.extract(value, options));
  }

  static locate(value, options = {}) {
    const scanner = new ShellScanner(SyntaxCatalog.forDialect(options.dialect));
    return new CommandSubstitution(scanner).findIn(String(value == null ? '' : value), 0, 0);
  }

  constructor(scanner) {
    this._scanner = scanner;
  }

  findIn(text, offset, depth) {
    const cursor = new SourceCursor(text);
    const found = [];
    while (!cursor.atEnd) {
      const substitution = this._readAt(cursor, offset, depth);
      if (substitution) found.push(substitution);
      else cursor.take();
    }
    return found;
  }

  _readAt(cursor, offset, depth) {
    const kind = CommandSubstitution._openerAt(cursor);
    if (kind === CommandSubstitution.BACKQUOTE) return this._readBackquoted(cursor, offset, depth);
    if (kind) return this._readParenthesized(cursor, kind, offset, depth);
    return null;
  }

  static _openerAt(cursor) {
    if (cursor.peek() === CommandSubstitution.BACKQUOTE) return CommandSubstitution.BACKQUOTE;
    return CommandSubstitution.PAREN_OPENERS.find((opener) => cursor.startsWith(opener)) || null;
  }

  _readParenthesized(cursor, kind, offset, depth) {
    const start = cursor.position;
    cursor.take(kind.length);
    const bodyStart = cursor.position;
    const closed = this._scanner.skipBalanced(cursor, ')');
    const bodyEnd = closed ? cursor.position - 1 : cursor.position;
    const body = cursor.text.slice(bodyStart, bodyEnd);
    return this._describe({ kind, body, closed, start, end: cursor.position, bodyStart, bodyEnd }, offset, depth);
  }

  _readBackquoted(cursor, offset, depth) {
    const start = cursor.position;
    cursor.take();
    if (!this._scanner.skipBackquoted(cursor)) {
      cursor.position = start;
      return null;
    }
    const raw = cursor.text.slice(start + 1, cursor.position - 1);
    const body = raw.replace(CommandSubstitution.BACKQUOTE_ESCAPE, '$1');
    const parts = { kind: CommandSubstitution.BACKQUOTE, body, closed: true, start, end: cursor.position, bodyStart: start + 1, bodyEnd: cursor.position - 1 };
    return this._describe(parts, offset, depth);
  }

  _describe(parts, offset, depth) {
    const nested = depth < ShellScanner.MAX_NESTING ? this.findIn(parts.body, offset + parts.bodyStart, depth + 1) : [];
    return {
      kind: parts.kind,
      body: parts.body,
      closed: parts.closed,
      span: { start: offset + parts.start, end: offset + parts.end },
      bodySpan: { start: offset + parts.bodyStart, end: offset + parts.bodyEnd },
      nested,
    };
  }
}

module.exports = CommandSubstitution;
