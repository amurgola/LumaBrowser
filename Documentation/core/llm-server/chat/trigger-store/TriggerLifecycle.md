# TriggerLifecycle

`core/llm-server/chat/trigger-store/TriggerLifecycle.js`

A trigger's derived lifecycle for [TriggerStore](../TriggerStore.md).

## Methods

- `TriggerLifecycle.configHash(trigger)`: sha256 hex over `kind`, `action.mode`,
  `action.prompt`, `source.respond`, `source.allowWrite`, `action.expect`,
  `action.agentId`, `action.artifactRootId`.
- `TriggerLifecycle.isArmable(trigger)`: `lastTest.ok` and `lastTest.configHash`
  equals the current hash.
- `TriggerLifecycle.statusOf(trigger)`: `unknown` (no trigger), `armed`,
  `auto_paused`, `awaiting_sample`, `tested` or `needs_test`, in that order.

## Why

The hash is what a passing test vouches for. Title and token are excluded so
renaming or rotating never invalidates a test; the folder, glob and
verification preset are excluded because they change what fires or arrives,
not what runs.
