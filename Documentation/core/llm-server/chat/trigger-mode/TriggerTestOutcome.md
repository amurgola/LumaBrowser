# TriggerTestOutcome

`core/llm-server/chat/trigger-mode/TriggerTestOutcome.js`

Shapes a trigger runner `runInline()` test result for the setup model.

## Methods (static)

- `from(result)` returns [TestRunOutcome](../scheduled-task/TestRunOutcome.md)`.from(result)`
  (`{ ran: false, error }` or `{ ran: true, status, error?, response?,
  responseTruncated? }` with the response capped at 2000 chars) plus, for a run:
  `webhookResponseBody` (the run's `respond_to_webhook` body), `toolsCalled`
  (tool names from the trace) and `warning` when `result.gating.filter.pass` is
  false: "this sample would NOT pass the live filter (failed: ...)".

## Why

A test bypasses gating on purpose so the sample always runs; the warning tells
the model that real events like it would be logged as filtered.
