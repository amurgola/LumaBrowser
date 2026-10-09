# PdfTextExtractor

`core/rag/PdfTextExtractor.js`

Extracts per-page text from a PDF with pdfjs-dist.

## Methods

- `PdfTextExtractor.extract(filePath)` resolves `[{ page, text }]` for every
  page that has text.
- `PdfTextExtractor.joinItems(items)` joins one page's pdfjs text items: a
  newline before an item whose baseline moved more than 6 units, a newline after
  an item flagged `hasEOL`, then spaces before newlines removed and the result
  trimmed.
- `PdfTextExtractor.MODULE_PATH` is `pdfjs-dist/legacy/build/pdf.mjs`.

## Why

pdfjs-dist v5 is ESM-only and must be its legacy build: the default
`build/pdf.mjs` references `DOMMatrix` at module scope (browser-only) and fails
with "DOMMatrix is not defined"; the legacy build polyfills it under Node and
Electron. It is loaded with `require` (require(esm) works on Node 22+), falling
back to dynamic `import` on older runtimes.
