# AttachmentReader

`core/llm-server/ipc/AttachmentReader.js`

Reads chat attachments into the shapes the composer sends.

## Methods

- `new AttachmentReader({ pdfText? })` (default [AttachmentPdfText](AttachmentPdfText.md)).
- `read(paths)` resolves one entry per path, in order:
  - image (`IMAGE_EXTS`): `{ name, size, kind: 'image', mime, base64 }`, at most 8 MB;
  - PDF: `{ name, size, kind: 'pdf', language: 'text', text }`, at most 20 MB; text
    past 200 KB is cut with `\n\n…(truncated: original extraction was N KB)` and `truncated: true`;
  - anything else: `{ name, size, kind: 'text', language: <ext>, text }`, at most 200 KB;
  - failures carry `error`: `Could not read file: ...`, `Folders cannot be attached. Drop the files inside it instead.`,
    `Image is too large (max 8 MB).`, `PDF is too large (max 20 MB).`,
    `PDF text extraction failed: ...`, `Text file is too large (max 200 KB).`,
    `Could not decode as UTF-8 text: ...`.
- `TEXT_EXTS`, `IMAGE_EXTS`, `IMAGE_MIME`, `TEXT_MAX`, `IMAGE_MAX`, `PDF_MAX`.

## Why

A huge file swamps the model's context for little value, and vision providers
refuse large images.
