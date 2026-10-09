# Scorer

`core/llm-server/eval/Scorer.js`

Deterministically scores agent transcripts against a golden task, giving a 0..1 score with a
per-check breakdown. Pure: no I/O and no model calls.

## Methods

- `Scorer.scoreTask(task, transcript)`: `transcript` is one transcript, or an array with one
  per turn for a multi-turn task. Returns
  `{ taskId, group, category, score, passed, checks: [{ name, passed, weight, detail }], health, meta: { iterations, durationMs, toolCount, turns } }`.
  Score is passed weight over total weight (1 when there are no checks); `passed` is
  `score >= (task.passThreshold ?? 1)`.
- `Scorer.normalizeTurns(task)` returns `[{ prompt, expect }]`, from `task.turns` or from the
  single-turn `prompt` + `expect` shorthand.
- `Scorer.harvestHealth(transcripts)` delegates to [TranscriptHealth](TranscriptHealth.md).

Per-turn checks are produced by [TurnChecks](TurnChecks.md), matchers by
[ExpectationMatcher](ExpectationMatcher.md).

## Transcript shape

Matches the agent runner's result:
`{ finalResponse, iterations, durationMs, error, toolCalls: [{ tool, params, success, error }],
health?: {...}, execution?: { ran, cases: [{ passed, detail }], error? } }`.

## Notes

- Multi-turn check names are prefixed `turn N: `; single-turn names are unprefixed so older
  expectations read the same.
- If fewer transcripts than turns were supplied, an `all turns completed` check fails;
  otherwise a conversation that died halfway could still score 1.0.
- `group` is the gambit's axis and `category` the prompt eval's. Each falls back to the other,
  then to `uncategorized`, so [Aggregator](Aggregator.md) (which buckets by category) works for
  both.
- A prompt or model change is only better if it moves these scores, especially the worst decile.
