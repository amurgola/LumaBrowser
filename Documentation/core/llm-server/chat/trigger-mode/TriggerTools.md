# TriggerTools

`core/llm-server/chat/trigger-mode/TriggerTools.js`

The trigger setup tools that walk the arming flow. They exist only in the
mode's setup turns, never in the runs.

## Methods

- `new TriggerTools({ triggerStore, services, emitEvent? })`; `services` is
  [TriggerModeServices](TriggerModeServices.md).
- `build()` returns the five tools: the [TriggerToolSpecs](TriggerToolSpecs.md)
  specs with `handler(params, ctx)` bound to the methods below. `ctx.conversationId`
  selects the trigger.
- `create(params, ctx)`: refuses without a conversation, when the conversation
  already has a trigger, or without a prompt; builds the source
  ([TriggerCreateSource](TriggerCreateSource.md)), resolves `agent_id`, creates
  the trigger, renames the conversation to its title, emits `triggers-changed`
  and returns `{ success, trigger, next }`, where `next` says how to get a
  sample for the kind (and, for a preset whose secret is missing, to have the
  user enter it in the runs view, never in chat).
- `setSample(params, ctx)`: `sample` is required except for page triggers; the
  runner's `eventFor(trigger, sample)` shapes it (a file path, the monitor's
  latest check), else `TriggerPayload.syntheticEvent`. Stores it and returns
  the summary.
- `test(params, ctx)`: needs a sample; runs `runner.runInline(id, { kind:
  'test' })` and returns `{ success, test, trigger }` with
  [TriggerTestOutcome](TriggerTestOutcome.md) (`{ ran: false, error: 'runner not
  ready; try again shortly' }` without a runner).
- `update(params, ctx)`: builds the patch ([TriggerUpdatePatch](TriggerUpdatePatch.md)),
  clears memory on `clear_memory: true`, applies the patch, runs the test when
  `run_test` is true, then applies `enabled`. A store error (for example arming
  without a passing test) returns `{ success: false, error, trigger, test }`.
  A change that disarmed an armed trigger, without `enabled` in the call, adds
  a note to test and re-arm.
- `rollback(params, ctx)`: `TriggerStore.rollbackTo`; on failure the error plus
  the version list; on success `{ restored, nowVersion, trigger, note }`, the
  note saying whether the trigger stays armed, can be armed at once, or needs a
  test.
- Every result's `trigger` is a [TriggerSummary](TriggerSummary.md).

## Why

The order inside `update` matters: the test vouches for the patched
configuration, so it runs after the patch and before arming, and arming is
refused by the store unless that configuration passed.
