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
  rows for the same message; capped at `LEDGER_MAX` (60). A row's text over
  `TEXT_MAX` (200) is cut at a word and ends with " …".
- `advanceClock(data, { advance, days, timeOfDay, weather })`: `hours` moves
  two steps along `TIMES`, `next-morning` adds a day, `days` adds n. A blank
  weather reading keeps the previous weather: a passage that does not mention
  the rain has not stopped it.
- `setPressure(data, text, turn)` the pressure line and the turn it was set.
  An empty text clears the line and still dates the reading.
- `keepPressure(data, text)` the stage call's reading of the standing
  pressure after a passage. An empty reading clears a standing line and
  returns true; `pressureTurn` is left alone, so the story editor's refresh
  keeps its own rhythm. A non-empty reading is ignored, whether it repeats the
  line or not: the stage keeps or drops, it does not author. False when
  nothing changed.
- `threads(data, { opened, advanced, closed }, turn)` dedupes by normalised
  text; an advanced (or re-opened) thread is touched again (`touched`,
  `lastTurn`, `moves`); keeps at most `THREADS_MAX` (8) open, evicting the
  lowest-ranked unpinned ones. An opened thread that asks what an open one
  already asks in other words (`sameQuestion`) touches that one instead of
  being added. An open, unpinned thread nothing has touched for
  `THREAD_STALE_TURNS` (8) turns is dropped. `pinThread(data, text, turn)`
  opens if needed and pins (one pinned open thread at a time), pinning the
  open thread with the same question when there is one; `pinnedThread(data)`.
- `sameQuestion(a, b)` true when two thread texts share at least half
  (`SAME_SHARE`) of the shorter one's meaningful words, two at the least;
  filler words (`FILLER`) and word endings are ignored. A live story held five
  wordings of "will Diana let Albert stay" side by side after three turns, and
  the narrator circled that one question every reply.
- `openThreads(data)` the open threads ranked best first: pinned, then most
  touched, then most recently touched; `threadMoves(data)` every turn on which
  a thread was opened or advanced (for the Lab's initiative probe).
- `unsummarised(data)` rows newer than the last summary; `needsSummary(data)`
  every `SUMMARY_EVERY_TURNS` (10) turns or `SUMMARY_LEDGER_ROWS` (20) fresh
  rows; `applySummary(data, text, turn)` also drops closed threads.
- `forget(data, messageId)`; `clockLine(data)` ("day 2, night, rain").

The ledger holds up to 80 rows and, over the cap, lets go of the least
important first (`LedgerRecall.keep`): a promise or a reveal outlives the
errands recorded around it.
