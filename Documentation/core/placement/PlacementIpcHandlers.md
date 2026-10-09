# PlacementIpcHandlers

`core/placement/PlacementIpcHandlers.js`

IPC controller for the Advanced tab's unified model placement: routes
`core.placement.*` to PlacementService. Each handler is wrapped by
`IpcEnvelope.enveloped`, so a throw replies `{ success: false, error }`.

## Methods

- `new PlacementIpcHandlers(placementService)`.
- `register()` registers:
  - `core.placement.isAvailable` -> `{ available: isAvailable() }` (failure adds `available: false`)
  - `core.placement.getConfig` -> `{ config: getConfig() }`
  - `core.placement.setConfig(patch)` -> `{ config: setConfig(patch || {}) }`
  - `core.placement.autoArrange` -> `{ config: autoArrange() }` (reset to the all-automatic baseline)
  - `core.placement.getMeasured` -> `{ measured: getMeasured() }` (test-render maxima keyed by model)
  - `core.placement.getVramSnapshot` -> `{ snapshot }`
  - `core.placement.getHotswapInfo` -> `{ info }` (RAM-sufficiency gate and suggested card for hotswap mode)
  - `core.placement.start` / `core.placement.stop` -> `startAll()` / `stopAll()` replies as-is
  - `core.placement.runTest` -> `runTest(send)`; progress streams to the invoking
    renderer on `core.placement.testEvent` as `{ type, payload }`. A throw also
    sends `{ type: 'error', payload: { message } }` before the failure reply.
- `PlacementIpcHandlers.TEST_EVENT_CHANNEL`.
