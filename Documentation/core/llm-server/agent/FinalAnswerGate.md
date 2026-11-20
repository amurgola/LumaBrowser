# FinalAnswerGate

`core/llm-server/agent/FinalAnswerGate.js`

Reviews a reply with no tool call before the loop accepts it as the final answer.

## Methods

- `new FinalAnswerGate({ history, steps, emit, verifier, finalCheck, awaitsLaterResult, nativeTools })`. `nativeTools`
  words the two nudges below for a model that calls tools through the function-calling
  channel ("call the tool") instead of the text fence ("emit the ```tool call"). `finalCheck`
  (optional) is the run caller's own condition for being finished: a function that
  returns text to send back to the model, or null to accept the answer.
  `awaitsLaterResult` (optional) is a function that says the run started work whose
  result arrives later (a background task,
  [BackgroundTaskTools](../chat/tasks/BackgroundTaskTools.md)); a check that throws
  counts as false.
- `review({ iteration, content, reasoningTail, inLastSteps })`: true when the
  loop should go around again. Nothing is nudged in the last-steps window.
  In order:
  1. Empty or whitespace reply (up to `MAX_EMPTY_RETRIES` 2): pop the empty
     assistant turn, push `AgentLoopText.emptyTurnNudge(nativeTools)` through the tool-result path with
     the reasoning tail as notes. Step `{ emptyRetry }`.
  2. Announced-but-unfulfilled action ([UnfulfilledIntent](UnfulfilledIntent.md)),
     once per run: push `AgentLoopText.stallNudge(nativeTools)`. Step `{ stallNudge: true }`.
     Skipped while `awaitsLaterResult()` is true: "I will tell you when it is done" is
     then the answer, and the nudge would set the model polling for the result.
  3. A pending no-op page action ([CompletionVerifier](CompletionVerifier.md)):
     hold the answer back with the verify nudge. Step `{ verifyNudge: true }`.
  4. The caller's `finalCheck`, asked once per run: when it returns text, hold the
     answer back (reason `final-check`) with that text.
     Step `{ finalCheckNudge: true }`. A check that throws accepts the answer. The
     chat uses it for a plan with steps still open
     ([PlanTool](../chat/plan/PlanTool.md)`.beforeFinalAnswer`).

## A held-back answer

Cases 3 and 4 emit `final-retracted` (reason `verify` or `final-check`), which makes
the chat pull the answer out of the bubble into the thinking pane, and push the nudge
as a user message through `AgentLoopText.heldBack(nudge)`. That adds
`AgentLoopText.HELD_ANSWER`: the user has not seen the answer, the next one is the only
one they read, so it must be written out in full and must not refer to the held one.

Why (seen 2026-11-18, Qwen3.8-27B, a research request with a five-step plan): the model
gave its whole report with steps 3 and 4 of the plan open, the plan check held it back,
the model ran one more search and then answered "Plan fully closed out. One addition to
my earlier report: ...". The held answer stays in the model's history as an assistant
turn, so without being told otherwise it treats it as delivered, and the user is left
with the addendum as the whole reply.
