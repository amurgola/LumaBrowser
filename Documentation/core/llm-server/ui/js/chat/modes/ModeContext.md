# ModeContext

`core/llm-server/ui/js/chat/modes/ModeContext.js`

What an extension chat mode's client hooks receive, and the safe way to call
them (a throwing hook is swallowed).

## Methods

- `forHooks()`: `{ api, conversationId, modeId, meta (getters), rootEl,
  sendTurn(text), setMeta({ data }) (merges and persists meta.data),
  applyBackground(b64OrUrl, mime), clearBackground(), refresh() }`.
- `forEvents()`: adds `turnElForMessage(id)` and `streamingTurnEl()`. `turnElForMessage` falls back to the live
  turn only while that turn has no message id of its own or carries the id asked for; otherwise `null`, so an
  event for an earlier reply (its reaction still running while a newer turn streams) never lands on the newer turn.
- `composerEls()`: `{ composer, textarea, bar }`.
- `callHook(name, ...args)`, `callHookAsync(name, ...args)`.
