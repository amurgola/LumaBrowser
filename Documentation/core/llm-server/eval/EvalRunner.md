# EvalRunner

`core/llm-server/eval/EvalRunner.js`

Drives a golden set through one or more prompt variants (and optionally
several models) and scores every run with [Scorer](Scorer.md).

## Methods

- `EvalRunner.runEval({ tasks, variants, agentRun, models = [null], onProgress? })`
  (async) returns `{ runs: [{ variantId, modelRef, label, results, aggregate }] }`,
  one run per model x variant (models outermost). `label` is `variant.label`
  or the id; `aggregate` is [Aggregator](Aggregator.md)`.aggregate(results)`.
  Rejects with `runEval: agentRun function is required` when `agentRun` is not
  a function.
  - `agentRun({ task, variant, modelRef })` returns a transcript
    (`{ finalResponse, iterations, durationMs, toolCalls, error }`). A throw is
    recorded as an errored transcript (`{ error, toolCalls: [], finalResponse: '', iterations: 0 }`)
    so one dead call never aborts the sweep; a falsy return scores as `{}`.
  - `onProgress({ done, total, taskId, variantId, modelRef, score })` fires
    after each task; a throwing listener is ignored.
- `EvalRunner.diffFromRuns(runResult, { baselineVariantId, candidateVariantId, modelRef = null })`
  returns `Aggregator.diffVariants` for the two variants of that model, or
  `null` when either is missing.
- `new EvalRunner(options).run()` is the instance form `runEval` uses.

## Why agentRun is injected

The real adapter ([EvalAdapter](EvalAdapter.md)) wires `agentRun` to the
live agent and needs the running app. Keeping the loop free of it makes the
sweep, the error handling and the scoring testable with a fake.
