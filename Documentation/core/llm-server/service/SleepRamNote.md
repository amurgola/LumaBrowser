# SleepRamNote

`core/llm-server/service/SleepRamNote.js`

The hint under an option that puts a model to sleep: how much RAM a sleep would hold against the RAM free now.

## Methods

- `new SleepRamNote({ getStatus, freemem?, totalmem? })`: `getStatus()` is the chat supervisor's status;
  `freemem` and `totalmem` default to `os.freemem()` / `os.totalmem()` (test seams).
- `noteFor(buildRow)` returns `{ text, tone }`:
  - when `getStatus().plan.runtimeId` is this build and the plan has `modelEstimatedBytes`, that figure is the
    RAM a sleep holds; [RamPinFitGate](../../shared/runtime/rampin/RamPinFitGate.md)`.evaluate({ freeBytes,
    totalRamBytes, pinBytes })` decides whether it fits: tone `info` when it does, `warn` (with the reserve the
    system keeps) when it does not;
  - otherwise the text says the figure is shown once the model has loaded, with the free RAM, tone `info`.
- `SleepRamNote.KIND` (`'sleep'`): the `ramNote` a custom option declares to get this note.

## Why

Asleep, the model's GPU memory sits in RAM that cannot be paged out, the same cost a RAM pin has, so the same rule
judges it. The VRAM the running or last planned model needs is the best estimate of that size, and only a plan of
this very build says so. Core names no engine: an option asks for the note through its declaration.
