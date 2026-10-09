# TextChunker

`core/rag/TextChunker.js`

Chunks parsed document pages for the knowledge base. The entry point of a small
pipeline:

1. [ChunkBudget](ChunkBudget.md) resolves the options into character sizes.
2. [BlockUnitizer](BlockUnitizer.md) reads the page as Markdown blocks and
   breaks them into units (sentences, whole code fences and tables, or lines of
   oversized ones), each tagged with its heading trail.
3. [ChunkPacker](ChunkPacker.md) packs the units into budget-sized windows,
   carrying whole trailing sentences between neighbours of one section.
4. Each window becomes a chunk.

## Methods

- `TextChunker.chunkText(text, { maxTokens, overlapTokens, headingContext })`
  returns `[{ text, charStart, charEnd, headings }]`. Blank or nullish text
  returns `[]`. Option defaults are documented in [ChunkBudget](ChunkBudget.md).
- `TextChunker.chunkDocument(pages, options)` takes `[{ page, text }]` and returns
  `[{ page, text, charStart, charEnd, headings }]` in page order.
- `TextChunker.TRAIL_SEPARATOR` (`' > '`) joins the heading line.

`charStart`/`charEnd` always cover exactly the page span the chunk came from
(no surrounding whitespace). `headings` is the trail of the chunk's first unit
(for a chunk that opens on a heading, that heading's parents). With
`headingContext` on (the default) and a non-empty trail, `text` is the trail on
its own line followed by the span, e.g. `Guide > Install\nRun the installer.`;
otherwise `text` equals the span.

## Why

- Offsets and page let a citation point at the exact span of the page.
- Markdown awareness: pages from HTML and `.md` files are Markdown, and a code
  sample or table cut in half is useless to both retrieval and the model.
- Heading trails ("contextual chunk headers"): a chunk in the middle of a
  section often never names its subject. Prefixing the section path puts those
  terms in the FTS index and the embedding, and tells the model where the text
  came from.
- Sentence-safe boundaries and a sentence-based carry: a fact near a chunk edge
  is retrievable whole from at least one side, and no chunk starts mid-word.

PDF pages are chunked per page; text that runs across a page break is not
joined, so every chunk keeps a single page number.
