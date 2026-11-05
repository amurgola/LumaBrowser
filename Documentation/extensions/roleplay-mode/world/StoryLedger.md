# StoryLedger

`extensions/roleplay-mode/world/StoryLedger.js`

The story's shared memory, `data.story = { turn, clock: { day, timeOfDay,
weather }, summary, summaryTurn, pressure, pressureTurn, ledger: [{ turn,
messageId, kind, text, who }], threads: [{ text, open, turn, lastTurn, touched,
moves: [turn], pinned?, closedTurn? }] }`, and the protagonist record
`data.protagonist = { name, pronouns, appearance, persona }`. `pressure` is the
narrator's own line of what bears down on the player ([PressureCall](../pipeline/PressureCall.md));
the pinned thread is the premise's central question.

## Methods

- `StoryLedger.of(data)`, `protagonist(data)` never null, never aliased.
- `beginTurn(data)` bumps and returns the turn counter.
- `record(data, events, { turn, messageId })` appends `KINDS` rows (`event`,
  `reveal`, `promise`, `death`, `move`, `injury`), replacing an earlier run's
  rows for the same message; capped at `LEDGER_MAX` (60).
- `advanceClock(data, { advance, days, timeOfDay, weather })`: `hours` moves
  two steps along `TIMES`, `next-morning` adds a day, `days` adds n.
- `setPressure(data, text, turn)` the pressure line and the turn it was set.
- `threads(data, { opened, advanced, closed }, turn)` dedupes by normalised
  text; an advanced (or re-opened) thread is touched again (`touched`,
  `lastTurn`, `moves`); keeps at most `THREADS_MAX` (8) open, evicting the
  lowest-ranked unpinned ones. `pinThread(data, text, turn)` opens if needed and
  pins (one pinned open thread at a time); `pinnedThread(data)`.
- `openThreads(data)` the open threads ranked best first: pinned, then most
  touched, then most recently touched; `threadMoves(data)` every turn on which
  a thread was opened or advanced (for the Lab's initiative probe).
- `unsummarised(data)` rows newer than the last summary; `needsSummary(data)`
  every `SUMMARY_EVERY_TURNS` (10) turns or `SUMMARY_LEDGER_ROWS` (20) fresh
  rows; `applySummary(data, text, turn)` also drops closed threads.
- `forget(data, messageId)`; `clockLine(data)` ("day 2, night, rain").
