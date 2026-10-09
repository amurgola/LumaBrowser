# SlotRequestRunner

`core/llm-service/service/SlotRequestRunner.js`

Runs one slot request at execution time for [LLMService](../LLMService.md):
start the managed server, resolve the provider, apply the model override, and
call the provider with occupancy tracking.

## Methods

- `new SlotRequestRunner({ managedServers, resolveSlot })`; `resolveSlot(slotId)`
  returns `{ provider, modelOverride }`.
- `run({ slotId, config, options, withVision = false, isAborted }, call)`:
  1. `managedServers.ensureReady(config, { withVision })`; on failure returns
     `{ success: false, error, code, runtimeId, runtimeName, installable }`.
  2. `isAborted()` true returns `{ success: false, error: 'aborted' }`.
  3. no provider returns `noProviderResult(slotId)`.
  4. a model override is written to `options.model`.
  5. returns `managedServers.track(config, () => call(provider))`.
- `SlotRequestRunner.noProviderResult(slotId)`:
  `{ success: false, error: 'No LLM provider configured for slot "<slotId>"' }`.
- `SlotRequestRunner.ABORTED`.

## Why

Resolving inside the queue worker, after the start, binds the provider to the
server's live port rather than a stale placeholder.
