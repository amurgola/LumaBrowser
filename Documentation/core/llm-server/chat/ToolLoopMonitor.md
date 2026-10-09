# ToolLoopMonitor

`core/llm-server/chat/ToolLoopMonitor.js`

Watches one agent run's tool calls for loops and stalls. One instance per run,
created by [BridgeRun](bridge/BridgeRun.md) and used by
[ToolCallPipeline](bridge/tools/ToolCallPipeline.md).

## Methods

- `new ToolLoopMonitor({ searchAllowance? })`.
- `attempt(name, params, run)`: `run` is `async () => ({ result, ran })`
  (`ran: false` when something downstream refused the call). Resolves to the
  same shape:
  1. opens a [CallRecord](tool-loop/CallRecord.md) in the run's
     [CallHistory](tool-loop/CallHistory.md);
  2. asks each check's `inspectRequest`; the first held finding returns
     `{ result: { success: false, error, message, loopCheck: { pattern, level } }, ran: false }`
     and `run` is never called;
  3. otherwise calls `run`; when it ran, settles the record with its
     [ResultNovelty](tool-loop/ResultNovelty.md) score, eases the
     [InterventionLadder](tool-loop/InterventionLadder.md) on progress, and
     sets `result.loopNotice` from the first `inspectOutcome` finding.
- `report()`: the [LoopTelemetry](tool-loop/LoopTelemetry.md) snapshot. RunHealth
  puts it on the turn's done payload as `toolLoop`.
- `PROGRESS_NOVELTY` (0.5).

Checks, in order: [IdenticalStreakCheck](tool-loop/IdenticalStreakCheck.md),
[EchoedLookupCheck](tool-loop/EchoedLookupCheck.md),
[SearchAllowanceCheck](tool-loop/SearchAllowanceCheck.md) (these can hold a
call back), then [InertActionCheck](tool-loop/InertActionCheck.md) and
[StaleSearchCheck](tool-loop/StaleSearchCheck.md) (these only add a note).
Text comes from [LoopFeedback](tool-loop/LoopFeedback.md).

## Why

Small local models can lose track of what they already did. They repeat a call,
reword the same search, or click a dead element until the step budget runs out,
and the user sees a turn that never answers. The monitor turns those patterns
into feedback the model can act on.

The design is a clean-room rewrite, built on three ideas:

- **Equivalence, not byte equality.** [CallSignature](tool-loop/CallSignature.md)
  normalises arguments: key order, whitespace, `"7"` vs `7`, and empty vs absent
  fields don't matter. [QueryResemblance](tool-loop/QueryResemblance.md) also
  catches reworded searches.
- **Progress, not counts.** Each result is scored by how much new material it
  brought. Two searches in a row that bring almost nothing new get flagged,
  however differently they were worded. Progress also lowers the pressure again.
- **Graduated interventions.** Every finding moves the run one level up: steer,
  insist, conclude. A real step forward moves it back down one level. The
  feedback starts as a redirect and only tells the model to wrap up once the
  warnings pile up. Practitioner loop guards also escalate from a hint to a
  block to a stop, but a fixed per-call limit can't tell a recovered run from
  a stuck one.

Checks are advisory. A check that throws finds nothing, and a call refused
downstream (missing arguments, denied approval) isn't counted as run, so the
corrected retry is never an echo.
