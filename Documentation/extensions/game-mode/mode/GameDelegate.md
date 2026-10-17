# GameDelegate

`extensions/game-mode/mode/GameDelegate.js`

The Game mode's delegation target for the chat's `delegate_task`
([DelegationTools](../../../core/llm-server/chat/delegation/DelegationTools.md)).
The start yields the setup the "New game" form persists (no image-model pins;
the turn falls back to the defaults) and a first message in the words
[GameKickoff](../ui/GameKickoff.md) sends.

## Methods

- `GameDelegate.TARGETS`: `game` ("Game: build a playable game"; params `task`
  required, `name`, `kind`).
- `GameDelegate.spec()` returns `{ targets, start({ args }) }`.
- `GameDelegate.start(args)` returns `{ data: { kind, premise, name? }, message,
  title: name or premise }`. `kind` is `'ai'` only when asked for, else `'web'`,
  and picks the AI-game or web-game kickoff.
