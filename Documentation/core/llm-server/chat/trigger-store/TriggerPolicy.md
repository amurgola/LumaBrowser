# TriggerPolicy

`core/llm-server/chat/trigger-store/TriggerPolicy.js`

Base class for the per-trigger policies stored in a trigger's source:
[TriggerFailurePolicy](TriggerFailurePolicy.md),
[TriggerApprovalPolicy](TriggerApprovalPolicy.md),
[TriggerMemoryPolicy](TriggerMemoryPolicy.md). All methods are static.

## Methods

- `normalizeInto(source, out)` (abstract): copies the policy's normalised keys
  from a raw source into `out` and returns `out`; only non-default values are stored.
- `of(trigger)` (abstract): the policy in force, defaults applied.
- `sourceOf(trigger)`: `trigger.source` or `{}`.
- `clampedInt(value, min, max)`: parsed and clamped integer, or `null` for
  null, undefined or non-numeric input.

Unimplemented methods throw `<Class>.<method> is not implemented`.
