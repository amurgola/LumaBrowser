# TestRunLog

`extensions/ext-test-harness/lib/TestRunLog.js`

The structured log of one test run.

## Methods

- `new TestRunLog(testId, variantId, config)`: `runId` `run_<ms>_<rand>`,
  status `running`.
- `addAssertion(name, passed, detail)` (non-string detail is JSON),
  `note(message, data)`, `addToolCall(entry)`.
- `complete(agentResult)`: status `completed`; merges `finalResponse`,
  `iterations`, `conversationHistory`, `toolCalls`; an agent `error` makes
  the status `error`.
- `fail(error)`, `timeout()` (`Test timed out after <ms>ms`).
- `toSummary()`: the `test_runs` row (`summary` is `<p> passed, <f> failed, <n> iterations`).
- `toFullLog()`: the `test_run_logs` row `{ id: 'log_<runId>', run_id, full_log }`.
