# DocumentParser

`core/rag/DocumentParser.js`

Turns a document file into page-tagged text for knowledge base ingestion.

## Methods

- `DocumentParser.parse(filePath)` resolves `[{ page, text }]` (1-based pages),
  by the reader `READERS` maps the extension to:
  - `text` (`.md`, `.markdown`, `.txt`, `.text`): one page, CRLF turned into
    LF, trimmed.
  - `html` (`.html`, `.htm`, `.xhtml`): one page of Markdown from
    [HtmlToMarkdown](../shared/content/HtmlToMarkdown.md) (kept untrimmed).
  - `pdf` (`.pdf`): one entry per page with text, via
    [PdfTextExtractor](PdfTextExtractor.md).
  - An empty result returns `[]`. An unsupported extension rejects with
    `Unsupported file type ".x". Supported: .md, .markdown, .txt, .text, .html, .htm, .xhtml, .pdf.`
- `DocumentParser.isSupported(filePath)` checks the extension, case-insensitively.
- `DocumentParser.supportedExtensions()` lists the extensions (with the dot) in
  `READERS` order; [RagFileIngestor](RagFileIngestor.md)'s refusal and
  [RagDocumentImporter](RagDocumentImporter.md)'s file-picker filter use it, so
  the list lives in one place.

## Why

Dispatch is by extension only, through one extension-to-reader table, so
adding a format is one row. The order groups extensions by reader, plain
formats first, which is how users see them. `.text` is a common alternative
plain-text extension and `.xhtml` is HTML the converter already handles. DOCX
is out of scope because nothing in the dependency tree parses it. The PDF
parser is loaded lazily, so a text-only ingest never pays for pdfjs.
