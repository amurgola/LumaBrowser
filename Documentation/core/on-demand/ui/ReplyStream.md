# ReplyStream

`core/on-demand/ui/ReplyStream.js`

One streamed reply in its assistant bubble.

## Methods

- `new ReplyStream(bubble, { onScroll, requestFrame })` shows "Thinking".
- `append(text)`, `rollback(chars)`: markdown re-rendered at most once per frame,
  with `{ streaming: true }` so open markdown never shows as raw syntax;
  `finish` renders the final text plainly.
- `addStep(tool, params)` ([StepLabels](StepLabels.md)), `finishStep(tool, ok)`
  (the oldest running step of that tool: `done`, or `fail` when ok is false).
- `finish({ error, aborted })`: an error replaces the text (`error` class); an
  empty reply reads "Stopped." or "Done."; running steps become `fail` (aborted
  or error) or `done`.
- `abandon()`: the log was cleared under it; stop painting.
