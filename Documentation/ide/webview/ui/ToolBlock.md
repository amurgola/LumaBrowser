# ToolBlock

`ide/webview/ui/ToolBlock.js`

One tool step as a row (`glyph verb detail · summary`) with an optional body: the command output tail (12 lines
live, 60 when done, 400 kept) or an edit's -/+ diff (24 lines). A file step opens the file on click; a finished
write or edit gets a "diff" button.

## Methods

- `new ToolBlock({ transcript, host, grammar, tool, params })`. Public: `tool`, `params`, `path`, `done`,
  `decision` (set by FrameRouter from an approval), `startedAt`, `node`.
- `appendOutput(chunk)`, `finish({ success, error, summary })`.

## Kept legacy behaviour

The edit diff is drawn at construction, before any approval decision is known, so a denied edit still shows its
proposed diff under the "denied" row.
