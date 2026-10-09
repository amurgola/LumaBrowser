# TriggerMode

`core/llm-server/ui/js/triggers/TriggerMode.js`

Client hooks for the core `trigger` chat mode (the server half is
core/llm-server/chat TriggerMode): an inline setup form whose submission
becomes the first turn, and the live [TriggerCard](TriggerCard.md) above the
composer of every trigger conversation. Desktop only in effect: the card needs
`api.triggers`, which the PWA shim does not have.

## Methods

- `new TriggerMode(chatExt, { card? })`; field `card`.
- `register()`: `chatExt.registerMode(hooks())`; a no-op without a registry.
- `hooks()`: `{ id: 'trigger', openSetup, startConversation, decorateComposer, onLeaveConversation }`.
  - `openSetup(api, ctx)` loads the agent and persisted-tab choices
    ([TriggerChoices](TriggerChoices.md)), builds `TriggerForm.schemaFor(...)`
    and opens it inline in `ctx.setupHost()`, else as a modal.
  - `startConversation(api, ctx, data)`: `ctx.sendTurn(TriggerForm.openingTurn(data, choices))` when the form has a prompt.
  - `decorateComposer(els, ctx)` / `onLeaveConversation()`: `card.decorate` / `card.leave`.

## Collaborators

`chatExt`: the [LumaChatExt](../chat-ext/LumaChatExt.md) instance
(`registerMode`, `openSchemaInline`, `openSchemaModal`). The LLM tab entry
creates `new TriggerMode(window.LumaChatExt, { card: new TriggerCard({ chatMode }) }).register()`
right after `LumaChatExt.install`, before the chat shell loads modes.
