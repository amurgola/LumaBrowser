# AiBridge

`extensions/game-mode/ai/AiBridge.js`

The server half of the in-game AI runtime: one request from a running AI game becomes one side completion (`context.chat.complete`) on the conversation's model, framed by the game, limited per game. Stateless per call: the game keeps the history.

## Methods

- `new AiBridge({ chat, getRouter })` (`getRouter` default the global chat router, for `completeStream` and the chat store).
- `complete(conversationId, body, { game })` one protocol step; an invalid reply under json/tools is retried once with a corrective nudge at temperature <= 0.5. Resolves `{ success: true, kind: final, text, value? }`, `{ success: true, kind: tool, name, args, raw }` or `{ success: false, error, raw?, busy? }`.
- `stream(conversationId, body, { onDelta, onDone, onError }, { game })` plain-text streaming; `onDone` gets the cleaned, unwrapped text; returns `{ abort }`.
- `gameFraming(conversationId, fallbackName)` `{ name, premise, worldNotes, kind }` from the setup; `resolveModelRef(conversationId)`; `load`.

## Why a JSON convention, not native tool_calls

The game's functions live in the browser, so the loop round-trips through the page anyway, and one object per reply is the shape local quantized models follow most reliably. The model only ever sees the tools the game declared for that call.
