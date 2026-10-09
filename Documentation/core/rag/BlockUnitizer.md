# BlockUnitizer

`core/rag/BlockUnitizer.js`

Turns page text into the unit groups [ChunkPacker](ChunkPacker.md) packs. Each
Markdown block from [MarkdownBlockScanner](MarkdownBlockScanner.md) becomes one
group of the smallest units that block may be broken into:

- prose: sentences from [SentenceSegmenter](SentenceSegmenter.md);
- code fences and tables: the whole block when it fits the budget, otherwise
  one unit per line from [LineSegmenter](LineSegmenter.md);
- any single unit still over budget: pieces from
  [OversizeSpanSplitter](OversizeSpanSplitter.md).

Headings are held back and put at the front of the next block's group, so a
chunk never ends on a bare heading. [HeadingTrail](HeadingTrail.md) gives each
unit its trail: a body unit gets the headings in force, a heading unit gets its
parents.

## Methods

- `new BlockUnitizer(budget)` with a [ChunkBudget](ChunkBudget.md).
- `unitize(source)` returns
  `[{ units: [{ start, end, trail, heading }], opensSection, start, end }]`.
  `opensSection` is true when the group starts with a heading.

## Why

Units are the only places a chunk may end, so this class decides what can be
split: sentences yes, code and tables only as a last resort and then only
between lines.
