# FlagRescue

`core/llm-server/server/launcher/FlagRescue.js`

One-shot unknown-flag rescue for a failed start.

## Methods

- `new FlagRescue({ finalizer, log })`.
- `attempt(ctx, err, failure)` returns null, or the success result of a retry:
  - it applies when `failure.kind === 'unknown-flag'`, the flag named by
    `FailureInterpreter.extractUnknownFlag` is in the launch args and not in
    `plan.userArgs`, and `UnsupportedFlagMemory.remember` newly records it;
  - with borrowed peers the flag is remembered but not retried;
  - otherwise: `ensureStopped()`, replan against `ctx.planDiag` with the row's
    learned flags, finalize, add the note
    `Flag rescue: <runtime> rejected <flag> on the first start, so this launch was replanned without it (remembered for this build).`,
    start, and return `{ ..., flagRescue: '<flag>' }`. A second failure propagates.

## Why

llama.cpp removes flags (`--no-mmap` died in b10875) and forks lag or lead
mainline. Flags the user typed are never rewritten; they fail through with the
interpreter's advice. `remember` returning false (already known) stops a loop.
