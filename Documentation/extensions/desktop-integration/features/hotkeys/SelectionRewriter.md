# SelectionRewriter

`extensions/desktop-integration/features/hotkeys/SelectionRewriter.js`

Rewrites text with the chat's model through the chat router's one-shot side
completion (`UnifiedChatRouter.complete`, the path the AI-fill fields use: not
stored, not touching the in-flight chat turn). Without a model ref the router
uses the chat's current model (last used, else Settings "Default LLM").

- `constructor({ getRouter })`: `getRouter()` returns
  `ExtensionGlobals.chatRouter()` or null, read per call.
- `available()`: the chat router is up (`complete` exists).
- `rewrite(text, { instruction, modelRef, timeoutMs })` -> `{ success, text }`:
  system message = the instruction (default `DEFAULT_INSTRUCTION`), user
  message = the text, temperature 0.3, `noThink: true`. The router has its own
  timeout; a hard stop fires `GRACE_MS` (2 s) later. Codes `EMPTY`, `TOO_LONG`
  (over 20000 characters), `NO_MODEL`, `TIMEOUT`, `FAILED`.
- `static clean(reply)`: drops `<think>` blocks, a code fence around the whole
  reply and quotes around the whole reply.
