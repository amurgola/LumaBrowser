# StreamMirror

`core/llm-server/chat/bridge/turn/StreamMirror.js`

Mirrors content tokens into the bubble and retracts a tool iteration's.

## Methods

- `new StreamMirror(hooks)`; `totalStreamed`, `toolSuppressed`.
- `beginIteration()`, `mirror(token)` (only with `onDelta`, not while suppressed).
- `suppressForTool()`: rolls back the iteration's text and diverts it (debris
  stripped) to the thinking pane, then hides the rest.
- `retractIteration()`: the same, post hoc (harmony calls, a held-back answer).
- `settleFinal(text, isAborted)`: when the bubble does not already equal the
  answer, rolls back what was streamed and drips the text ([TextDrip](TextDrip.md)).
