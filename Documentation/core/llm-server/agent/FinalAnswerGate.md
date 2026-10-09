# FinalAnswerGate

`core/llm-server/agent/FinalAnswerGate.js`

Reviews a reply with no tool call before the loop accepts it as the final answer.

## Methods

- `new FinalAnswerGate({ history, steps, emit, verifier })`.
- `review({ iteration, content, reasoningTail, inLastSteps })`: true when the
  loop should go around again. Nothing is nudged in the last-steps window.
  In order:
  1. Empty or whitespace reply (up to `MAX_EMPTY_RETRIES` 2): pop the empty
     assistant turn, push `EMPTY_TURN_NUDGE` through the tool-result path with
     the reasoning tail as notes. Step `{ emptyRetry }`.
  2. Announced-but-unfulfilled action ([UnfulfilledIntent](UnfulfilledIntent.md)),
     once per run: push `STALL_NUDGE`. Step `{ stallNudge: true }`.
  3. A pending no-op page action ([CompletionVerifier](CompletionVerifier.md)):
     emit `final-retracted`, push the verify nudge. Step `{ verifyNudge: true }`.
