# InFlightTurn

`core/llm-server/chat/router/InFlightTurn.js`

The router's single in-flight chat turn.

## Methods

- `handle`: the turn's abort handle or null (the facade's `active`); `local`: served by the managed server.
- `begin(handle, local)`: `local` only counts with a handle.
- `clear()`: forgets without aborting.
- `abort()`: forgets, aborts the handle (errors swallowed), returns whether it was local.
- `isLocalLive()`.

## Why

`clear(own)` forgets the turn only while the slot still holds that handle: a turn superseded while its mode was still preparing settles after the newer turn took the slot, and must not empty it.

One in-flight turn is the legacy contract: a new turn supersedes the old, and schedulers, triggers and the terminal bridge defer while `router.active` is set.
