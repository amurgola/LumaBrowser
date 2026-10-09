# ToolEventReducer

`core/llm-server/ui/js/chat/stream/ToolEventReducer.js`

Folds one `tool` event into the live message's steps. `pending` shows an instant
placeholder (filled with the tool name, target and a live byte count as they
arrive), `run` reconciles it, `approval` adds a held step, `approval-done`
fails it on reject or timeout ("Declined", "No answer") or drops it when
approved (the real run follows), `done` settles the newest open non-approval
step, `tab` and `tab-end` drive the live tab preview, `cancel` drops
placeholders.

## Methods

- `ToolEventReducer.apply(message, payload)`: returns `{ tabEnded: true }` when
  the preview froze.
- `ToolEventReducer.openStep(message, tool)`.
