# LiteChatReducer

`extensions/ai-chat/ui/lite-panel/LiteChatReducer.js`

Pure translation of the chat router's chatEvent vocabulary into the side
panel's view state. No DOM, timers or api calls.

## Methods

- `createInitialState()`: `{ conversationId: null, running: false, content:
  '', hasReasoning: false, statusPhase: null, tools: [], done: false,
  finishReason: null, error: null }`.
- `startTurn(state)`: a fresh state keeping `conversationId`, `running: true`.
- `reduce(state, evt)` never mutates: `meta` (conversation id), `status`
  (phase), `delta` (append, clears phase), `reasoning-delta` (flag),
  `rollback` (drop the last `chars`, clamped; `<= 0` is a no-op), `tool`
  ([LiteToolCards](LiteToolCards.md)), `artifact` (a done card titled
  `title || name || 'Artifact created'`), `done` (`running: false`,
  `done: true`, `finishReason`, `aborted`, conversation id), `error`
  (`{ message ('request failed'), code, runtimeId, installable }`). Other
  types return the state unchanged.
- `statusLabel(phase)`: `STATUS_LABELS` or the phase capitalised with
  dashes as spaces plus an ellipsis; `''` for none.

The methods are static and do not use `this`, so they can be destructured.
