# ConversationExportRenderer

`core/llm-server/chat/ConversationExportRenderer.js`

Renders an export document to PDF or PNG bytes in a hidden BrowserWindow.

## Methods

- `ConversationExportRenderer.KINDS` is `Set(['pdf', 'png'])`.
- `ConversationExportRenderer.PNG_MAX_HEIGHT` (16000) caps a PNG capture.
- `ConversationExportRenderer.defaultFileName(title, kind)` returns a
  filesystem-safe `<title>.<kind>`: path-hostile and control characters become
  spaces, whitespace collapses, at most 80 characters, `conversation` when empty.
- `new ConversationExportRenderer({ BrowserWindow? })`: `BrowserWindow` is
  injectable for tests; by default it is required from `electron` on first use.
- `render(html, kind)` resolves the file bytes (a Buffer). Rejects for an unknown
  kind before opening anything. Writes the HTML to a temp file, loads it in a
  hidden sandboxed window `PAGE_WIDTH` wide, waits for images (at most 5 s), then
  either `printToPDF` (A4, backgrounds) or measures the page, resizes the window
  to it (clamped to 200..PNG_MAX_HEIGHT), waits 250 ms and captures it with
  `stayHidden`. The window and temp folder are always cleaned up.

## Why

A plain hidden window, not offscreen rendering: OSR refused to load the file at
all (ERR_FAILED), while `capturePage(rect, { stayHidden: true })` is the
documented way to paint a hidden window without ever showing it.

Chromium's maximum texture size bounds a single capture, so a taller page is cut
at `PNG_MAX_HEIGHT`; the PDF path has no such cap.

The caller (the `core.llmServer.conv.export` IPC) asks the user for the
destination first and writes the bytes itself.
