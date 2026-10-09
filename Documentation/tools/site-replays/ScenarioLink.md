# ScenarioLink

`tools/site-replays/ScenarioLink.js`

A [FakeBridgeLink](FakeBridgeLink.md) that answers the session's handshake and plays a replay scenario's timeline as
the turn. At an `@approve` cue it calls `pressApprove()` (the recorder types `y` into the session) and waits for the
session's `approve` frame; `@edited` cues are skipped.

## Methods

- `new ScenarioLink({ scenario, pressApprove })`: `scenario` is `{ AGENT, MODEL, timeline() }`.
- `send(type, payload)`: `hello` -> `ready` (after 60 ms, conversation `conv_storefront`), `list-agents` -> `agents`,
  `approve` records `decision`, `prompt` plays the timeline; anything else is ignored.
- `turnDone`: resolves when the timeline has played. `decision`: the last approval decision.
