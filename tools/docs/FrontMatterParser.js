const DocGlob = require('./DocGlob');
const FrontMatterError = require('./FrontMatterError');

class FrontMatterParser {
  static parse(text, file = '<doc>') {
    const src = String(text || '').replace(/\r\n/g, '\n');
    if (!src.startsWith('---\n')) return null;
    const raw = FrontMatterParser._readKeys(FrontMatterParser._body(src, file), file);
    const appliesTo = FrontMatterParser._appliesTo(raw, file);
    const scope = typeof raw.scope === 'string' ? raw.scope : null;
    FrontMatterParser._requireMetaWhenEmpty(appliesTo, scope, file);
    return { applies_to: appliesTo, scope, raw };
  }

  static unquote(s) {
    const quoted = (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"));
    return quoted ? s.slice(1, -1) : s;
  }

  static _body(src, file) {
    const end = src.indexOf('\n---', 4);
    if (end < 0) throw new FrontMatterError(file, 'front matter is not closed with ---');
    return src.slice(4, end).split('\n');
  }

  static _readKeys(lines, file) {
    const raw = {};
    let listKey = null;
    lines.forEach((line, i) => {
      if (!line.trim() || line.trim().startsWith('#')) return;
      const item = /^\s+-\s*(.*)$/.exec(line);
      if (item && listKey) { raw[listKey].push(FrontMatterParser.unquote(item[1].trim())); return; }
      listKey = FrontMatterParser._readKeyValue(raw, line, i, file);
    });
    return raw;
  }

  static _readKeyValue(raw, line, index, file) {
    const kv = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!kv) throw new FrontMatterError(file, `front matter line ${index + 2} is not "key: value": ${line.trim()}`);
    const [, key, valueRaw] = kv;
    const value = valueRaw.trim();
    if (value === '') { raw[key] = []; return key; }
    raw[key] = FrontMatterParser._scalarOrInlineList(key, value, file);
    return null;
  }

  static _scalarOrInlineList(key, value, file) {
    if (value === '[]') return [];
    if (!value.startsWith('[')) return FrontMatterParser.unquote(value);
    if (!value.endsWith(']')) throw new FrontMatterError(file, `${key}: inline list is not closed`);
    return value.slice(1, -1).split(',').map((s) => FrontMatterParser.unquote(s.trim())).filter(Boolean);
  }

  static _appliesTo(raw, file) {
    if (!Object.prototype.hasOwnProperty.call(raw, 'applies_to')) return null;
    if (!Array.isArray(raw.applies_to)) throw new FrontMatterError(file, 'applies_to must be a list');
    return raw.applies_to.map((p) => {
      const problem = DocGlob.problem(p);
      if (problem) throw new FrontMatterError(file, `applies_to pattern "${p}": ${problem}`);
      return p;
    });
  }

  static _requireMetaWhenEmpty(appliesTo, scope, file) {
    if (appliesTo && appliesTo.length === 0 && scope !== 'meta') {
      throw new FrontMatterError(file, 'applies_to is empty; declare "scope: meta" if this doc governs no code');
    }
  }
}

module.exports = FrontMatterParser;
