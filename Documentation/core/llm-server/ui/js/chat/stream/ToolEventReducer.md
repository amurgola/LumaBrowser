# ToolEventReducer

`core/llm-server/ui/js/chat/stream/ToolEventReducer.js`

Folds one `tool` event into the live message's steps. `pending` shows an instant
placeholder (filled with the tool name, target and a live byte count as they
arrive; a native call's `index` gives each slot of a batch its own placeholder,
the text fence has one), `run` reconciles the oldest placeholder naming its
tool (else the oldest) and stamps the step with the bridge's `callId` and, for
a real batch, `_batch { size, index }`, `approval` adds a held step (keeping `detail`,
the `grants` family label and `grantScope`, default `'run'`), `approval-done`
fails it on reject or timeout ("Declined", "No answer") or drops it when
approved (the real run follows), `status` keeps a running tool's own progress
(`step`, `totalSteps`, `elapsedMs`, `message`) on the newest open step for that
tool as `_progress` (an image render's step count, the engine a search is
asking, an MCP server's progress notification), `done` settles the newest open
non-approval step and clears its progress, `tab` and `tab-end` drive the live tab preview, `cancel` drops
placeholders.

## Methods

- `ToolEventReducer.apply(message, payload)`: returns `{ tabEnded: true }` when
  the preview froze.
- `ToolEventReducer.openStep(message, tool, callId?)`: the running step with
  that call id, else the newest running non-approval step of that tool; `done`
  and `status` use it.
