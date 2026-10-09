# TestRunOutcome

`core/llm-server/chat/scheduled-task/TestRunOutcome.js`

Shapes a scheduler `runInline()` result for the setup model.

## Methods

- `TestRunOutcome.from(result)`: `{ ran: false, error }` when the run did not
  start (`test run could not start` without an error), else
  `{ ran: true, status, error?, response?, responseTruncated? }`. `status`
  defaults to `unknown`; `response` is cut to `RESPONSE_CHARS` (2000).

## Why

Enough of the response to judge success, not enough to flood the setup context.
