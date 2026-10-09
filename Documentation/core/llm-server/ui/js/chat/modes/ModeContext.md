# ModeContext

`core/llm-server/ui/js/chat/modes/ModeContext.js`

What an extension chat mode's client hooks receive, and the safe way to call
them (a throwing hook is swallowed).

## Methods

- `forHooks()`: `{ api, conversationId, modeId, meta (getters), rootEl,
  sendTurn(text), setMeta({ data }) (merges and persists meta.data),
  applyBackground(b64OrUrl, mime), clearBackground(), refresh() }`.
- `forEvents()`: adds `turnElForMessage(id)` (falls back to the live turn) and
  `streamingTurnEl()`.
- `composerEls()`: `{ composer, textarea, bar }`.
- `callHook(name, ...args)`, `callHookAsync(name, ...args)`.
