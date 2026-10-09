# TriggerPatch

`core/llm-server/chat/trigger-store/TriggerPatch.js`

Works out what [TriggerStore](../TriggerStore.md)`.update` does to a trigger.

## Methods

- `TriggerPatch.apply(current, patch)` returns `{ next, enabled, rearmed }`.
  `next` has the trimmed title (blank keeps the old one) and the merged and
  re-normalised source and action. `enabled`: with `patch.enabled` unset, the
  current state unless the config hash moved (then `false`); `false` disarms;
  `true` requires `next` to be armable or throws `ARM_REFUSAL`
  (`trigger cannot be armed until a test of its current configuration passes`).
  `rearmed` is armed now and not before; the store then clears the auto-pause and streak.

## Why

A stale test must never vouch for new instructions, so any hash change disarms.
