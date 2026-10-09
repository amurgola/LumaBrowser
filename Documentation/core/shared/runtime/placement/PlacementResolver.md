# PlacementResolver

`core/shared/runtime/placement/PlacementResolver.js`

Resolves where a server lands from the [placement layout](../PlacementLayout.md).

## Methods

- `PlacementResolver.resolve(layout, serverId, { diagnostics, requiredBytes, allowSplit = true, devices })`
  returns `{ cudaDevice, offloadToCpu, devices, split }` (VramCoordinator's
  reserve shape) or null for "automatic, let first-come-first-serve decide":
  - unknown server, no effective resource, dangling resource: null;
  - RAM: `{ cudaDevice: null, offloadToCpu: true, devices: [], split: null }`;
  - GPU resources: remote refs and cards missing from the probe are skipped
    (unless the probe is empty); nothing left: null;
  - `allowSplit: false` (image): the first ordered card with room for
    `requiredBytes`; if every card is measured with some room but none fits,
    the first card with `offloadToCpu: true`; otherwise the first card;
  - splittable (LLM): an explicit split matching the present card count wins;
    no size hint pins the first card; otherwise the smallest prefix whose room
    sums to the need, with a split proportional to each card's room in whole
    percent.
- `PlacementResolver.deviceRoomMap(diagnostics, devices)` card index ->
  `{ total, free, room }`, with room = free minus
  `CudaDevicePicker.PER_CARD_RESERVE_BYTES` (1 GB), floored at 0.

## Why

Order is fill order: "fill the first card, overflow to the next". Every GPU in
a layout is optional, so a card that is not detected is skipped instead of
launched against, but an unreadable probe must not wipe out the layout. The
`devices` option takes VramCoordinator's ledger-debited cards so ordered fill
sees VRAM that in-flight loads already claimed (bug H11).
