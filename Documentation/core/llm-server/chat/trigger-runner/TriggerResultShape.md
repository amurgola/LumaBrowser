# TriggerResultShape

`core/llm-server/chat/trigger-runner/TriggerResultShape.js`

The response-shape check of a trigger with `action.expect`: the run's JSON
result must match every expectation (matchers as in the eval harness, through
[ExpectationMatcher](../../eval/ExpectationMatcher.md)), otherwise the run
counts as failed and is not retried.

## Methods

- `TriggerResultShape.resultJson(responseBody, finalResponse)`: the
  respond_to_webhook body when there is one (`responseBody !== undefined`; a
  string is parsed), else the final message parsed as JSON with a fenced
  ```` ```json ```` block unwrapped. undefined when nothing parses.
- `TriggerResultShape.error(expect, json)`: null when the shape holds, `response
  is not a JSON object`, or `response shape mismatch on: <keys>`.
