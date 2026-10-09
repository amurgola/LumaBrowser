# GambitHealth

`core/llm-server/gambit/GambitHealth.js`

Totals the per-task health signals of a gambit run and scores them as clean
turns over total turns, with a sentence naming each incident kind.

## Methods

- `GambitHealth.totals(results)` sums `result.health` counters
  (`GambitHealth.COUNTERS`: `repetitionAborted`, `offFormatCalls`,
  `emptyReplies`, `timedOut`, `errors`, `turns`, `lengthCutCompletions`,
  `missingArgCalls`, `overflowRecoveries`) and merges `offFormatShapes` counts.
- `GambitHealth.score(totals)` returns `{ score, turns, incidents, detail }`.
  No turns scores 1 with detail `no turns ran`; otherwise
  `score = 1 - min(turns, hard + 0.5 * soft) / turns`, where hard is
  repetition aborts + timeouts + errors + empty replies and soft is off-format
  calls + missing-argument refusals. `detail` lists every non-zero kind (or
  `clean`), naming off-format shapes most frequent first, e.g.
  `3 off-format tool calls (xml-tool_call 2, bare-json 1)`.

## Why

Health is a tax on every turn, not a set of tasks. An abort or a timeout costs
the whole turn; an off-format call was recovered by the bridge and a
missing-argument refusal usually got a retry, so they cost half. A rate rather
than an incident count keeps a long suite from looking healthier than a short
one. Naming the shapes turns a symptom ("24 off-format calls") into a decision
("all xml-tool_call: document that syntax for this family").

Overflow recoveries and length-cut completions are named in the detail but do
not cost points.
