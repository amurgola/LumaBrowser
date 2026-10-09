# TriggerUpdatePatch

`core/llm-server/chat/trigger-mode/TriggerUpdatePatch.js`

Builds the [TriggerStore](../TriggerStore.md) patch for `update_trigger`. Used by
[TriggerTools](TriggerTools.md).

## Methods (static)

- `build(trigger, params, services)` returns `{ patch }` or `{ error }`. The
  patch always has `origin: 'chat'` (it labels the instruction version) and
  only the fields that were passed:
  - `title`;
  - `action`: `prompt`, `mode`, `agentId` (via `services.resolveAgentId`; an
    unknown id is the error), `expect` (empty or null clears), `artifactRootId`
    (empty clears);
  - `source` for file triggers: `dir` (validated), `glob`, `events`,
    `recursive`, `allowWrite`; for webhooks: `respond`, `preset`, `authHeader`
    (empty clears); for every kind the [TriggerGatingParams](TriggerGatingParams.md)
    keys, with `batch_max` alone keeping the current window (or clearing the
    batch when there is none) and `memory_runs` alone / `memory` without runs
    keeping the rest of the current memory settings.
  - Errors: a bad `quiet_hours`, and for webhooks a batch window combined with
    `respond: result` (judged on the patched values).
- `hasChanges(patch)`: whether the patch changes more than `origin`.
