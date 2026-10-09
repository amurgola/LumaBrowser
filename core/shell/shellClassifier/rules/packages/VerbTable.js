class VerbTable {
  static ANY = '*';

  constructor(sections) {
    this._rowsByTool = new Map();
    for (const section of sections) this._addSection(section);
  }

  get tools() {
    return [...this._rowsByTool.keys()];
  }

  get effects() {
    return [...new Set([...this._rowsByTool.values()].flat().map((row) => row.effect))];
  }

  has(tool) {
    return this._rowsByTool.has(tool);
  }

  match(tool, toolArgs, shownAs = tool) {
    for (const row of this._rowsByTool.get(tool) || []) {
      const matched = this._matchRow(row, toolArgs);
      if (matched !== null) return this._finding(shownAs, row, matched.map((index) => toolArgs.spelledWords[index]));
    }
    return null;
  }

  _addSection({ tools, rows }) {
    const compiled = rows.map((row) => ({ ...row, segments: row.path ? VerbTable._compilePath(row.path) : null }));
    for (const tool of tools) this._rowsByTool.set(tool, [...(this._rowsByTool.get(tool) || []), ...compiled]);
  }

  static oneOf(...words) {
    return (word) => words.includes(word);
  }

  static _compilePath(path) {
    const segments = Array.isArray(path) ? path : path.split(' ');
    return segments.map((segment) => VerbTable._compileSegment(segment));
  }

  static _compileSegment(segment) {
    if (typeof segment === 'function') return segment;
    if (segment === VerbTable.ANY) return () => true;
    return VerbTable.oneOf(...segment.split('|'));
  }

  _matchRow(row, toolArgs) {
    if (row.when && !row.when(toolArgs)) return null;
    if (row.segments) return this._matchPath(row.segments, toolArgs);
    if (row.anyWord) return this._matchAnyWord(row.anyWord, toolArgs);
    return [];
  }

  _matchPath(segments, toolArgs) {
    const words = toolArgs.words;
    for (const start of toolArgs.pathStarts()) {
      const candidate = words.slice(start, start + segments.length);
      if (candidate.length === segments.length && candidate.every((word, i) => segments[i](word))) return candidate.map((_, i) => start + i);
    }
    return null;
  }

  _matchAnyWord(predicate, toolArgs) {
    const index = toolArgs.words.findIndex((candidate) => predicate(candidate));
    return index === -1 ? null : [index];
  }

  _finding(tool, row, typedWords) {
    const subject = [tool, ...typedWords].join(' ');
    return { effect: row.effect, subject, scope: row.scope || null, preview: Boolean(row.preview) };
  }
}

module.exports = VerbTable;
