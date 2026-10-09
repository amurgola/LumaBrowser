const ChunkBudget = require('./ChunkBudget');
const BlockUnitizer = require('./BlockUnitizer');
const ChunkPacker = require('./ChunkPacker');

class TextChunker {
  static TRAIL_SEPARATOR = ' > ';

  static chunkText(text, options = {}) {
    const source = text == null ? '' : String(text);
    if (!source.trim()) return [];
    const budget = new ChunkBudget(options);
    const groups = new BlockUnitizer(budget).unitize(source);
    const windows = new ChunkPacker(budget).pack(groups);
    return windows.map((units) => TextChunker._render(source, units, budget));
  }

  static chunkDocument(pages, options = {}) {
    return (pages || []).flatMap((page) => TextChunker.chunkText(page.text, options).map((chunk) => ({ page: page.page, ...chunk })));
  }

  static _render(source, units, budget) {
    const charStart = units[0].start;
    const charEnd = units[units.length - 1].end;
    const headings = units[0].trail;
    const span = source.slice(charStart, charEnd);
    return { text: TextChunker._withContext(span, headings, budget), charStart, charEnd, headings };
  }

  static _withContext(span, headings, budget) {
    if (!budget.headingContext || !headings.length) return span;
    return `${headings.join(TextChunker.TRAIL_SEPARATOR)}\n${span}`;
  }
}

module.exports = TextChunker;
