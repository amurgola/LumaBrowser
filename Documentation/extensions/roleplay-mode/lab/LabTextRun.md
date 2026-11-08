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
- `run({ turns?, mockSideCalls?, judge?, grounding?, scenario? })` ->
  `{ scenario, transcript: [{ turn, user, assistant, messageId, contextTokens }],
  data, probe, cast, prose, judge, physicality, error }` (`cast` from
  [CastProbe](CastProbe.md)). `scenario` is a name or a built scenario
  ([LabTextScenarios](LabTextScenarios.md)); a scenario listing the
  `physicality` judge also gets [PhysicalityJudge](PhysicalityJudge.md) when
  `judge` is on, and one listing `reveal` gets [RevealJudge](RevealJudge.md)
  plus a retention check per recall turn (`reveal.retention`). A scenario's
  `contextWindow` replaces `CONTEXT_WINDOW` for the narrator's budgets.
  Every run also returns `context` (a per-turn [ContextAudit](ContextAudit.md)
  summary; each turn keeps its own `audit`), `bodyDetail` ([BodyDetailScore](BodyDetailScore.md))
  and `grounding` (`{ turnsWithCards, cards, expectNone, ok }` from each
  turn's `groundingNotes`, also kept per turn as `transcript[i].grounding`; a
  scenario with `expectNoGrounding` passes only when no card fired).
  `grounding: false` sets the story's `options.bodyGrounding` and
  `surfaceGrounding` off, for an A/B of the grounding on the same code.
  The narrator request carries the mode's `samplers` so a real run gets DRY
  and XTC like a chat turn. With `mockSideCalls` a `LabHarness` with the
  scenario's canned replies is installed for the side calls and stepped aside
  (`active = false`) around each narrator call, which always runs for real.
  Emits `lab:text { phase: 'turn', turn, of, user, assistant }` per turn and
  `lab:text { phase: 'done', probe, cast, prose, judge, error }` at the end.
  From the terminal: `npm run rp:text` ([TextRunCli](../../../tools/roleplay/TextRunCli.md)).
