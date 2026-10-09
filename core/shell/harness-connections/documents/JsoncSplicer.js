const { parseTree, findNodeAtLocation, createScanner, SyntaxKind } = require('jsonc-parser');
const KeyPath = require('./KeyPath');

class JsoncSplicer {
  static DEFAULT_UNIT = '  ';

  constructor(text) {
    this._text = text;
    this._root = parseTree(text, [], { allowTrailingComma: true });
    this._eol = text.includes('\r\n') ? '\r\n' : '\n';
    this._unit = JsoncSplicer._indentUnit(text);
  }

  set(path, value) {
    const node = findNodeAtLocation(this._root, path);
    if (node) return this._splice(node.offset, node.offset + node.length, this._render(value, this._lineIndent(node.offset)));
    const depth = this._deepestObjectDepth(path);
    const container = depth === 0 ? this._root : findNodeAtLocation(this._root, path.slice(0, depth));
    const nested = path.slice(depth + 1).reduceRight((inner, key) => ({ [key]: inner }), value);
    return this._addProperty(container, path[depth], nested);
  }

  remove(path) {
    const node = findNodeAtLocation(this._root, path);
    return node ? this._removeProperty(node.parent) : this._text;
  }

  _deepestObjectDepth(path) {
    for (let depth = path.length - 1; depth >= 0; depth -= 1) {
      const node = depth === 0 ? this._root : findNodeAtLocation(this._root, path.slice(0, depth));
      if (!node) continue;
      if (node.type !== 'object') throw new Error(`Cannot add ${KeyPath.label(path)}: ${KeyPath.label(path.slice(0, depth))} is not an object.`);
      return depth;
    }
    return 0;
  }

  _addProperty(object, key, value) {
    const properties = object.children;
    if (!properties.length) return this._fillEmpty(object, key, value);
    if (!this._spansLines(object)) return this._appendInline(properties[properties.length - 1], key, value);
    return this._appendLine(properties[properties.length - 1], key, value);
  }

  _fillEmpty(object, key, value) {
    const open = object.offset + 1;
    const close = object.offset + object.length - 1;
    const outer = this._lineIndent(object.offset);
    const inner = outer + this._unit;
    const line = `${this._eol}${inner}${this._property(key, value, inner)}`;
    if (this._text.slice(open, close).trim() !== '') return this._splice(open, open, line);
    return this._splice(open, close, `${line}${this._eol}${outer}`);
  }

  _appendInline(last, key, value) {
    const end = last.offset + last.length;
    return this._splice(end, end, `, ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  }

  _appendLine(last, key, value) {
    const end = last.offset + last.length;
    const comma = this._commaAfter(end);
    const indent = this._lineIndent(last.offset);
    const lineEnd = this._lineEnd(comma >= 0 ? comma + 1 : end);
    const line = `${this._eol}${indent}${this._property(key, value, indent)}${comma >= 0 ? ',' : ''}`;
    const edits = [{ start: lineEnd, end: lineEnd, insert: line }];
    if (comma < 0) edits.push({ start: end, end, insert: ',' });
    return this._spliceAll(edits);
  }

  _removeProperty(property) {
    const object = property.parent;
    const siblings = object.children;
    if (this._isOnlyContent(object, property)) return this._splice(object.offset + 1, object.offset + object.length - 1, '');
    const index = siblings.indexOf(property);
    if (this._ownsItsLines(property)) return this._removeLines(property, siblings[index - 1]);
    return this._removeInline(property, siblings[index - 1], siblings[index + 1]);
  }

  _removeLines(property, previous) {
    const end = property.offset + property.length;
    const comma = this._commaAfter(end);
    const stop = this._afterLineBreak(this._lineEnd(comma >= 0 ? comma + 1 : end));
    const edits = [{ start: this._lineStart(property.offset), end: stop, insert: '' }];
    if (comma < 0 && previous) {
      const previousComma = this._commaAfter(previous.offset + previous.length);
      if (previousComma >= 0) edits.push({ start: previousComma, end: previousComma + 1, insert: '' });
    }
    return this._spliceAll(edits);
  }

  _removeInline(property, previous, next) {
    const end = property.offset + property.length;
    if (previous) return this._splice(this._commaAfter(previous.offset + previous.length), end, '');
    if (next) return this._splice(property.offset, next.offset, '');
    const comma = this._commaAfter(end);
    return this._splice(property.offset, comma >= 0 ? comma + 1 : end, '');
  }

  _isOnlyContent(object, property) {
    if (object.children.length !== 1) return false;
    const inside = this._text.slice(object.offset + 1, object.offset + object.length - 1);
    const rest = inside.replace(this._text.slice(property.offset, property.offset + property.length), '');
    return /^[\s,]*$/.test(rest);
  }

  _ownsItsLines(property) {
    const before = this._text.slice(this._lineStart(property.offset), property.offset);
    const end = property.offset + property.length;
    const comma = this._commaAfter(end);
    const afterStart = comma >= 0 ? comma + 1 : end;
    const after = this._text.slice(afterStart, this._lineEnd(afterStart));
    const commaOnSameLine = comma < 0 || !this._text.slice(end, comma).includes('\n');
    return before.trim() === '' && after.trim() === '' && commaOnSameLine;
  }

  _property(key, value, indent) {
    return `${JSON.stringify(key)}: ${this._render(value, indent)}`;
  }

  _render(value, indent) {
    return JSON.stringify(value, null, this._unit).split('\n').join(this._eol + indent);
  }

  _spansLines(node) {
    return this._text.slice(node.offset, node.offset + node.length).includes('\n');
  }

  _commaAfter(offset) {
    const scanner = createScanner(this._text, true);
    scanner.setPosition(offset);
    return scanner.scan() === SyntaxKind.CommaToken ? scanner.getTokenOffset() : -1;
  }

  _lineStart(offset) {
    return this._text.lastIndexOf('\n', offset - 1) + 1;
  }

  _lineEnd(offset) {
    const newline = this._text.indexOf('\n', offset);
    if (newline < 0) return this._text.length;
    return this._text[newline - 1] === '\r' ? newline - 1 : newline;
  }

  _afterLineBreak(offset) {
    if (this._text.startsWith('\r\n', offset)) return offset + 2;
    return this._text[offset] === '\n' ? offset + 1 : offset;
  }

  _lineIndent(offset) {
    return /^[ \t]*/.exec(this._text.slice(this._lineStart(offset)))[0];
  }

  _splice(start, end, insert) {
    return this._spliceAll([{ start, end, insert }]);
  }

  _spliceAll(edits) {
    return [...edits]
      .sort((a, b) => b.start - a.start)
      .reduce((text, { start, end, insert }) => text.slice(0, start) + insert + text.slice(end), this._text);
  }

  static _indentUnit(text) {
    const indented = /^([ \t]+)\S/m.exec(text);
    if (!indented) return JsoncSplicer.DEFAULT_UNIT;
    return indented[1].startsWith('\t') ? '\t' : indented[1];
  }
}

module.exports = JsoncSplicer;
