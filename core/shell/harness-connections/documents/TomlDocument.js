const { parse: parseToml } = require('smol-toml');
const ConfigDocument = require('./ConfigDocument');
const ConfigValue = require('./ConfigValue');
const KeyPath = require('./KeyPath');
const TomlRenderer = require('./TomlRenderer');
const TomlScanner = require('./TomlScanner');

class TomlDocument extends ConfigDocument {
  static ID = 'toml';
  static LABEL = 'TOML';
  static EMPTY = '';

  _parse(text) {
    try {
      return parseToml(text);
    } catch (err) {
      throw new Error(TomlDocument._syntaxMessage(err));
    }
  }

  _textWith(path, value) {
    const statements = TomlScanner.scan(this._text);
    const enclosing = TomlDocument._enclosingPair(statements, path);
    if (enclosing) return this._rewriteInline(enclosing, path, value);
    const pair = TomlDocument._pairAt(statements, path);
    if (pair) return this._splice([{ start: pair.valueStart, end: pair.valueEnd, insert: TomlRenderer.value(value) }]);
    if (ConfigValue.isTable(value)) return this._withTable(statements, path, value);
    return this._withNewPair(statements, path, value);
  }

  _textWithout(path) {
    const statements = TomlScanner.scan(this._text);
    const enclosing = TomlDocument._enclosingPair(statements, path);
    if (enclosing) return this._rewriteInline(enclosing, path, undefined);
    return this._splice(this._removalSpans(statements, path));
  }

  _withTable(statements, path, table) {
    const eol = this._eol();
    const rendered = TomlRenderer.table(path, table, eol);
    const index = statements.findIndex((s) => s.kind === 'table' && KeyPath.equals(s.path, path));
    if (index < 0) return this._appendBlock(this._splice(this._removalSpans(statements, path)), rendered);
    const body = this._sectionBody(statements, index);
    const others = this._removalSpans(statements, path).filter((span) => span.start >= body.end || span.end <= body.start);
    const keepsLineEnd = body.end > 0 && this._text[body.end - 1] === '\n';
    return this._splice([...others, { ...body, insert: keepsLineEnd ? rendered : rendered.slice(0, -eol.length) }]);
  }

  _withNewPair(statements, path, value) {
    const parent = path.slice(0, -1);
    const line = TomlRenderer.pair(path[path.length - 1], value);
    if (parent.length === 0) return this._withRootPair(statements, line);
    const index = statements.findIndex((s) => s.kind === 'table' && KeyPath.equals(s.path, parent));
    const eol = this._eol();
    if (index < 0) return this._appendBlock(this._text, `[${TomlRenderer.keyPath(parent)}]${eol}${line}${eol}`);
    return this._insertLine(this._sectionBody(statements, index).end, line);
  }

  _withRootPair(statements, line) {
    const firstHeader = statements.findIndex((s) => s.kind !== 'pair');
    const rootPairs = firstHeader < 0 ? statements : statements.slice(0, firstHeader);
    if (rootPairs.length) return this._insertLine(rootPairs[rootPairs.length - 1].end, line);
    if (firstHeader < 0) return this._insertLine(this._text.length, line);
    const at = this._commentBlockStart(statements[firstHeader].start);
    return this._splice([{ start: at, end: at, insert: line + this._eol() + this._eol() }]);
  }

  _rewriteInline(pair, path, value) {
    const whole = ConfigValue.plain(KeyPath.lookup(this._data, pair.path).value);
    TomlDocument._assignNested(whole, path.slice(pair.path.length), value);
    return this._splice([{ start: pair.valueStart, end: pair.valueEnd, insert: TomlRenderer.value(whole) }]);
  }

  _removalSpans(statements, path) {
    const spans = [];
    for (let i = 0; i < statements.length; i += 1) {
      const s = statements[i];
      if (!KeyPath.startsWith(s.path, path) || (s.kind === 'pair' && s.inArrayTable)) continue;
      if (s.kind === 'pair') {
        spans.push(this._pairRemoval(s));
        continue;
      }
      spans.push(this._sectionRemoval(statements, i));
      i = this._sectionEndIndex(statements, i) - 1;
    }
    return spans;
  }

  _pairRemoval(pair) {
    const aloneAbove = pair.start === 0 || this._blankLineBefore(pair.start) >= 0;
    const blankAfter = this._blankLineAfter(pair.end);
    return { start: pair.start, end: aloneAbove && blankAfter >= 0 ? blankAfter : pair.end, insert: '' };
  }

  _sectionRemoval(statements, index) {
    const body = this._sectionBody(statements, index);
    let { start, end } = body;
    for (let prev = this._blankLineBefore(start); prev >= 0; prev = this._blankLineBefore(start)) start = prev;
    if (start === body.start) {
      for (let next = this._blankLineAfter(end); next >= 0; next = this._blankLineAfter(end)) end = next;
    }
    return { start, end, insert: '' };
  }

  _sectionBody(statements, index) {
    const last = statements[this._sectionEndIndex(statements, index) - 1];
    return { start: statements[index].start, end: last.end };
  }

  _sectionEndIndex(statements, index) {
    const next = statements.findIndex((s, i) => i > index && s.kind !== 'pair');
    return next < 0 ? statements.length : next;
  }

  _commentBlockStart(offset) {
    let start = offset;
    for (let prev = this._lineBefore(start); prev && prev.text.trim().startsWith('#'); prev = this._lineBefore(start)) start = prev.start;
    return start;
  }

  _blankLineAfter(offset) {
    if (offset >= this._text.length) return -1;
    const newline = this._text.indexOf('\n', offset);
    const end = newline < 0 ? this._text.length : newline + 1;
    return this._text.slice(offset, end).trim() === '' ? end : -1;
  }

  _blankLineBefore(offset) {
    const line = this._lineBefore(offset);
    return line && line.text.trim() === '' ? line.start : -1;
  }

  _lineBefore(offset) {
    if (offset <= 0 || this._text[offset - 1] !== '\n') return null;
    const start = this._text.lastIndexOf('\n', offset - 2) + 1;
    return { start, text: this._text.slice(start, offset) };
  }

  _insertLine(offset, line) {
    const eol = this._eol();
    const lead = offset > 0 && this._text[offset - 1] !== '\n' ? eol : '';
    const trail = offset < this._text.length || lead === '' ? eol : '';
    return this._splice([{ start: offset, end: offset, insert: lead + line + trail }]);
  }

  _appendBlock(text, block) {
    if (text.trim() === '') return block;
    const eol = this._eol();
    const ended = text.endsWith('\n') ? text : text + eol;
    return (ended.endsWith(`\n${eol}`) ? ended : ended + eol) + block;
  }

  _splice(edits) {
    return [...edits]
      .sort((a, b) => b.start - a.start)
      .reduce((text, { start, end, insert }) => text.slice(0, start) + insert + text.slice(end), this._text);
  }

  _eol() {
    return this._text.includes('\r\n') ? '\r\n' : '\n';
  }

  static _pairAt(statements, path) {
    return statements.find((s) => s.kind === 'pair' && !s.inArrayTable && KeyPath.equals(s.path, path)) || null;
  }

  static _enclosingPair(statements, path) {
    return statements.find((s) => s.kind === 'pair' && !s.inArrayTable && s.path.length < path.length && KeyPath.startsWith(path, s.path)) || null;
  }

  static _assignNested(table, path, value) {
    const parent = path.slice(0, -1).reduce((node, key) => {
      if (!ConfigValue.isTable(node[key])) node[key] = {};
      return node[key];
    }, table);
    if (value === undefined) delete parent[path[path.length - 1]];
    else parent[path[path.length - 1]] = value;
  }

  static _syntaxMessage(err) {
    const reason = String((err && err.message) || err).split('\n')[0].replace(/^Invalid TOML document:\s*/, '');
    return err && err.line ? `TOML syntax error on line ${err.line}: ${reason}.` : `TOML syntax error: ${reason}.`;
  }
}

module.exports = TomlDocument;
