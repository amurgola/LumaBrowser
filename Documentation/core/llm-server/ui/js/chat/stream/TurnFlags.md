# TurnFlags

`core/llm-server/ui/js/chat/stream/TurnFlags.js`

The per-turn flags every chat2 call carries, built in one place so a send and a
regenerate (the same turn run again) never drift apart (legacy bug H4).

## Methods

- `TurnFlags.build(state, voiceActive)`: `agent`, `tools`, `disabledTools`,
  `choicesEnabled` (off in voice), `noThink` and `voice` (voice only),
  `reasoningEffort` (undefined when the chat follows the default), `docsSource`
  (always a boolean, so turning the documentation pill off is persisted too; see
  [DocsSourceContext](../composer/DocsSourceContext.md)).
- `TurnFlags.context(messages)`: user turns and non-empty replies as
  `{ role, content }`.
