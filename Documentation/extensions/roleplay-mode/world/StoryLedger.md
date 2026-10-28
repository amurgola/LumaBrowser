# StoryLedger

`extensions/roleplay-mode/world/StoryLedger.js`

The story's shared memory, `data.story = { turn, clock: { day, timeOfDay,
weather }, summary, summaryTurn, ledger: [{ turn, messageId, kind, text, who }],
threads: [{ text, open, turn, closedTurn? }] }`, and the protagonist record
`data.protagonist = { name, pronouns, appearance, persona }`.

## Methods

- `StoryLedger.of(data)`, `protagonist(data)` never null, never aliased.
- `beginTurn(data)` bumps and returns the turn counter.
- `record(data, events, { turn, messageId })` appends `KINDS` rows (`event`,
  `reveal`, `promise`, `death`, `move`, `injury`), replacing an earlier run's
  rows for the same message; capped at `LEDGER_MAX` (60).
- `advanceClock(data, { advance, days, timeOfDay, weather })`: `hours` moves
  two steps along `TIMES`, `next-morning` adds a day, `days` adds n.
- `threads(data, { opened, closed }, turn)` dedupes by normalised text, keeps
  at most `THREADS_MAX` (8) open; `openThreads(data)`.
- `unsummarised(data)` rows newer than the last summary; `needsSummary(data)`
  every `SUMMARY_EVERY_TURNS` (10) turns or `SUMMARY_LEDGER_ROWS` (20) fresh
  rows; `applySummary(data, text, turn)` also drops closed threads.
- `forget(data, messageId)`; `clockLine(data)` ("day 2, night, rain").
