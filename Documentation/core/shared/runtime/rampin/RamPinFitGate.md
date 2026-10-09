# RamPinFitGate

`core/shared/runtime/rampin/RamPinFitGate.js`

Refuses a RAM pin that would leave less than the shared OS reserve of
available memory.

## Methods

- `RamPinFitGate.evaluate({ freeBytes, totalRamBytes, pinBytes, modelName })`
  returns `{ ok, reserveBytes, message }`. `reserveBytes` is
  `HotswapRamGate.ramReserveBytes(totalRamBytes)` (max of 16 GB and 15% of
  RAM); `ok` is `free - pin >= reserve` (inclusive). `message` is null when ok,
  else the user-facing refusal ("Not enough free RAM to pin <model>: it needs
  X GiB with Y GiB free, keeping Z GiB headroom for the system.").
- `RamPinFitGate.GIB`.

## Why

Locked pages are unevictable; starving the OS hurts far more than a slow model
load. The guardrail comes from the RamPin C# tool and shares its reserve with
the hotswap gate ([HotswapRamGate](../HotswapRamGate.md)). Pure, so the
boundary is testable without a real machine.
