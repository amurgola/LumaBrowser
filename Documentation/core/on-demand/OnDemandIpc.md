# OnDemandIpc

`core/on-demand/OnDemandIpc.js`

IPC controller for Luma On Demand. Routes only; no logic.

## Methods

- `OnDemandIpc.register(overlay)` registers:
  - Panel channels, answered only when the sender is the overlay's own
    webContents (`overlay.isOwnSender`), else `undefined`:
    `on-demand:ready` -> `markReady()`, `on-demand:drag` -> `drag(dx, dy)`,
    `on-demand:drag-end` -> `dragEnd()`, `on-demand:set-expanded` -> `setExpanded`,
    `on-demand:get-state` -> `state()`, `on-demand:history` -> `history()`,
    `on-demand:abort` -> `abortTurn()`, `on-demand:send` -> `sendTurn(args)`.
  - Shell channels (the settings toggle and notification-log placement):
    `on-demand:get-enabled`, `on-demand:set-enabled` (returns `{ success, enabled }`),
    `on-demand:get-tile` -> `tileBounds()`.

## Why

The panel channels drive chat turns against the user's tab, so no other
renderer may call them. Not wrapped in `IpcEnvelope` because the legacy replies
(raw state, `undefined` for foreign senders) are what the renderer expects.
