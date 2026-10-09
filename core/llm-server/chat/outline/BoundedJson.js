const ValueKind = require('./ValueKind');

class BoundedJson {
  static stringify(value, maxChars) {
    const sink = { parts: [], length: 0, maxChars };
    return BoundedJson._write(value, sink) ? sink.parts.join('') : null;
  }

  static _write(raw, sink) {
    const value = ValueKind.normalize(raw);
    const kind = ValueKind.of(value);
    if (kind === 'array') return BoundedJson._writeArray(value, sink);
    if (kind === 'object') return BoundedJson._writeObject(value, sink);
    return BoundedJson._writeLeaf(value, kind, sink);
  }

  static _writeLeaf(value, kind, sink) {
    if (kind === 'absent') return BoundedJson._append('null', sink);
    if (kind === 'string' && value.length > sink.maxChars) return false;
    return BoundedJson._append(JSON.stringify(value), sink);
  }

  static _writeArray(items, sink) {
    if (!BoundedJson._append('[', sink)) return false;
    for (let i = 0; i < items.length; i++) {
      if (i > 0 && !BoundedJson._append(',', sink)) return false;
      if (!BoundedJson._write(items[i], sink)) return false;
    }
    return BoundedJson._append(']', sink);
  }

  static _writeObject(obj, sink) {
    if (!BoundedJson._append('{', sink)) return false;
    let written = 0;
    for (const key of Object.keys(obj)) {
      if (!ValueKind.isPresent(obj[key])) continue;
      if (written++ > 0 && !BoundedJson._append(',', sink)) return false;
      if (!BoundedJson._append(`${JSON.stringify(key)}:`, sink)) return false;
      if (!BoundedJson._write(obj[key], sink)) return false;
    }
    return BoundedJson._append('}', sink);
  }

  static _append(text, sink) {
    sink.parts.push(text);
    sink.length += text.length;
    return sink.length <= sink.maxChars;
  }
}

module.exports = BoundedJson;
