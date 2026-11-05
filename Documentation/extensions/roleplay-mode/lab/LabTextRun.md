# LabTextRun

`extensions/roleplay-mode/lab/LabTextRun.js`

Drives one scripted text playthrough through the REAL roleplay turn: for each
player line the mode's `buildTurn` builds the layered context (trimmed history
and anchor included), the request is shaped by the router's own
`ModeTurnMessages` (through CoreRequire, with a small fallback), the story
model answers through `complete`, and the production `postProcess` updates the
memory before the next line.

## Methods

- `new LabTextRun({ mode, complete, Harness, emit, ModeTurnMessages })`.
- `run({ turns?, mockSideCalls?, judge?, scenario? })` ->
  `{ transcript: [{ turn, user, assistant, messageId, contextTokens }], data,
  probe, cast, prose, judge, error }` (`cast` from [CastProbe](CastProbe.md)).
  The narrator request carries the mode's `samplers` so a real run gets DRY
  and XTC like a chat turn. With `mockSideCalls` a `LabHarness` with the
  scenario's canned replies is installed for the side calls and stepped aside
  (`active = false`) around each narrator call, which always runs for real.
  Emits `lab:text { phase: 'turn', turn, of, user, assistant }` per turn and
  `lab:text { phase: 'done', probe, cast, prose, judge, error }` at the end.
  From the terminal: `npm run rp:text` ([TextRunCli](../../../tools/roleplay/TextRunCli.md)).
