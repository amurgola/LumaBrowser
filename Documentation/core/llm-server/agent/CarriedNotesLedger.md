# CarriedNotesLedger

`core/llm-server/agent/CarriedNotesLedger.js`

Tracks the reasoning notes riding on a run's tool-result messages and keeps
their total under budget.

## Methods

- `new CarriedNotesLedger(totalBudget)`, `total`.
- `track(messages, index, notes)`: records the note, then evicts while over
  budget and more than one note is held.
- `remap(fn)`: after a compaction, `fn(index)` gives the new index or a
  negative number for a message that is gone (its note is dropped).

## Why middle-first

The first note is the run's plan and the newest is what the next step reasons
from; middle steps are safest to lose because their results are still there.
Eviction strips the note suffix instead of restoring a remembered base, because
the tool-history pass may already have stubbed the message.
