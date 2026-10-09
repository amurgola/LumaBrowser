# AttachmentPdfText

`core/llm-server/ipc/AttachmentPdfText.js`

Plain text from a PDF attached to a chat, extracted in this process with pdfjs-dist.

## Methods

- `AttachmentPdfText.extract(filePath, { load? })` resolves the text: each page's
  items joined with single spaces and whitespace collapsed, pages joined with a
  blank line, empty pages dropped. The document is always released. `load()`
  defaults to the lazily loaded `MODULE_PATH`.
- `AttachmentPdfText.pageText(items)`, `AttachmentPdfText.joinPages(pageTexts)`.
- `MODULE_PATH` `pdfjs-dist/legacy/build/pdf.mjs`.

## Why

Text only (no font rendering setup, verbosity 0). The legacy build is required
because `build/pdf.mjs` touches `DOMMatrix` at module scope; it is loaded with
`require` and falls back to `import`. [PdfTextExtractor](../../rag/PdfTextExtractor.md)
does the same for RAG but keeps line structure; this keeps the chat's prose join.
