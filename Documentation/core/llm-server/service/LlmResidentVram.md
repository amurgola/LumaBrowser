# LlmResidentVram

`core/llm-server/service/LlmResidentVram.js`

What the loaded chat model itself holds on each card, measured as the drop in free
VRAM across its own load. Owned by [LLMServerService](../LLMServerService.md) as
`residentVram` and driven by [LlmSupervisorHooks](LlmSupervisorHooks.md).

## Methods

- `new LlmResidentVram({ readCards, refresh })`: `readCards()` returns the cards as
  last read (`[{ index, freeBytes }]`, default `CudaDeviceProbe.readDevices(null)`);
  `refresh()` resolves once a new reading is in (default
  `NvidiaSmiStream.shared.refresh({ maxAgeMs: 0 })`). Neither default spawns a process
  from a synchronous read.
- `noteLoadStarting()` (supervisor `starting`): drops any earlier measurement and keeps
  each card's free VRAM from the last reading as the baseline.
- `noteReady()` (supervisor `ready`, async, never rejects): refreshes the reading and
  records, per card in the baseline, `max(0, baseline free - free now)`. A newer
  `noteLoadStarting` or `clear` during the refresh discards the result.
- `clear()` (supervisor `idle` or `error`): no baseline, nothing held.
- `heldBytes(cardIndex)`: bytes held on that card; 0 with no model loaded or before its
  load settled.
- `withoutOwn(diagnostics)`: a copy of the diagnostics with each CUDA device's
  `memoryFreeMB` raised by this model's share and capped at `memoryTotalMB`; the input
  unchanged when nothing is held or there are no devices.
- `MIB` (1024 x 1024).

## Why

A Start stops the loaded chat model before it reads the cards, so a preview of the next
Start (the context fit matrix, [LocalModelOptions](../ipc/LocalModelOptions.md)) must
count that model's VRAM as free. Planning from live free VRAM without handing it back
would show every rung of the loaded model as not fitting; planning from the persisted
snapshot's totals showed rungs as fitting where Start split the model over two cards.
The baseline is the last reading at `starting` because the launcher read the cards
moments before; every buffer is allocated by the time the server answers `/health`.
