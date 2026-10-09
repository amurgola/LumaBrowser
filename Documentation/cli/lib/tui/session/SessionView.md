# SessionView

`cli/lib/tui/session/SessionView.js`

Paints the [App](App.md) each frame.

## Methods

- `new SessionView(app)`.
- `render()`: done blocks at the head of the transcript move to `committed` and their lines are
  committed to scrollback; the live blocks render under them; when the live region would not fit
  above the bottom chrome, the overflow at the top of the oldest live blocks is frozen into
  scrollback (`Block.frozen`). After a resize (`app.fullRepaint`) frozen counts reset and the whole
  transcript is rebuilt through `Screen.repaintAll`; otherwise `Screen.paint` diffs it.
- `transcriptLines(width)`: lines of every live block past its frozen prefix.
- `bottomLines(width)`: `{ lines, cursor }`: while a turn runs, a blank line, the
  [ThinkingPreview](../chrome/ThinkingPreview.md) when thinking streams folded, and the
  [StatusLine](../chrome/StatusLine.md) (hints: `ctrl+o expand|collapse`, `esc stop`, queued
  follow-ups); then the approval prompt (three lines) or the editor; then the footer (folder and model
  on the left; `ctrl+c again to quit`, the last turn's tokens and share of the context window, or the
  agent and approval mode on the right).
