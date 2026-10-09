# ServingNotes

`core/llm-server/server/launch/ServingNotes.js`

The plan notes for the optional serving features of a launch.

## Methods

- `ServingNotes.build(state)` returns, in order and only when they apply: slots
  (`--parallel`, or requested but unsupported); context retention; the RAM prompt
  cache (size, off with its reason, or unsupported); tensor parallelism (on, or
  requested but off with the gate's reason or because the model does not fully
  fit); a KV precision forced to f16; family tuning with skipped flags; the family
  drafter (on, off by setting, unsupported, or missing on disk); a measured VRAM
  basis; distributed inference (on with the split and idle remote devices,
  unsupported, or skipped because the model fits locally or runs expert offload);
  MoE expert offload (fill, all experts in RAM, or why it is off or not needed);
  and the load-mode fallback when both spellings are rejected.

## Why

These features are opt-in or conditional, so the user needs to know whether each
one actually happened. A request that a gate refused always produces a note
naming the gate.
