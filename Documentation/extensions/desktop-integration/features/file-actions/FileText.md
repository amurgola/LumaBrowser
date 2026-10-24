# FileText

`extensions/desktop-integration/features/file-actions/FileText.js`

The readable text of a file for the [file-actions](index.md) Read aloud.

- `extract(item, { pdfText, fsImpl })`: a PDF through the chat's
  AttachmentPdfText; otherwise the first `READ_BYTES` (64 KB) as UTF-8, with
  Markdown (`fromMarkdown`) and HTML (`fromHtml`) reduced to their words.
  Whitespace is collapsed (`clean`). Speech cuts the result at 4000
  characters.
