const MarkdownBlockScanner = require('./MarkdownBlockScanner');
const HeadingTrail = require('./HeadingTrail');
const SentenceSegmenter = require('./SentenceSegmenter');
const LineSegmenter = require('./LineSegmenter');
const SpanSegmenter = require('./SpanSegmenter');
const OversizeSpanSplitter = require('./OversizeSpanSplitter');

class BlockUnitizer {
  constructor(budget) {
    this._budget = budget;
    this._oversize = new OversizeSpanSplitter(budget.maxChars);
    this._sentences = new SentenceSegmenter();
    this._lines = new LineSegmenter();
  }

  unitize(source) {
    this._source = source;
    this._trail = new HeadingTrail();
    this._groups = [];
    this._pendingHeadings = [];
    for (const block of new MarkdownBlockScanner().scan(source)) this._admit(block);
    this._flushHeadings();
    return this._groups;
  }

  _admit(block) {
    if (block.kind === 'heading') return this._holdHeading(block);
    const trail = this._trail.titles();
    const units = this._blockSpans(block).map((span) => BlockUnitizer._unit(span, trail, false));
    this._pushGroup([...this._pendingHeadings, ...units]);
  }

  _holdHeading(block) {
    const parents = this._trail.enter(block.level, block.title);
    const spans = this._fitted(SpanSegmenter.tighten(this._source, block.start, block.end));
    this._pendingHeadings.push(...spans.map((span) => BlockUnitizer._unit(span, parents, true)));
  }

  _flushHeadings() {
    if (this._pendingHeadings.length) this._pushGroup(this._pendingHeadings);
  }

  _pushGroup(units) {
    this._pendingHeadings = [];
    if (!units.length) return;
    this._groups.push({
      units, opensSection: units[0].heading, start: units[0].start, end: units[units.length - 1].end,
    });
  }

  _blockSpans(block) {
    const whole = SpanSegmenter.tighten(this._source, block.start, block.end);
    if (!whole) return [];
    if (block.kind === 'prose') return this._fittedAll(this._sentences.segment(this._source, whole.start, whole.end));
    if (this._budget.fits(whole.end - whole.start)) return [whole];
    return this._fittedAll(this._lines.segment(this._source, whole.start, whole.end));
  }

  _fittedAll(spans) {
    return spans.flatMap((span) => this._fitted(span));
  }

  _fitted(span) {
    if (!span) return [];
    return this._budget.fits(span.end - span.start) ? [span] : this._oversize.split(this._source, span);
  }

  static _unit(span, trail, heading) {
    return { start: span.start, end: span.end, trail, heading };
  }
}

module.exports = BlockUnitizer;
