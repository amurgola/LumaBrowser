# ImageSlotLauncher

`core/image-server/router/ImageSlotLauncher.js`

Makes one image slot's server run the requested model before a render.

## Methods

- `new ImageSlotLauncher({ imageServerService })`.
- `ensureReady({ wantId, slotRole, send })` resolves `{ server, status, cold }`
  when the slot is ready with a port, or `{ error, cold }`:
  1. The switch decision is taken once: the slot runs a different model.
  2. Starting with the wanted model (no switch): `status { phase: 'starting-server' }`,
     then wait on `server.waitUntilSettled()`. A failed wait marks the request cold
     and falls through.
  3. Not ready, or a switch: `status { phase: 'switching-model' | 'starting-server' }`,
     stop the slot if ready or starting (a failed stop is ignored), then
     `svc.startServerResolved(wantId, { role: slotRole })`. Failure returns its
     error or `Failed to start the image server.`.
  4. Not ready or no port afterwards: `Image server is <state>, not ready.`
  `cold` is true whenever the model had to load.

## Why

Coalescing on a start already in progress removed the transient "Cannot start:
server is starting" failure on the first edit after a cold start. Only the
target slot is ever stopped, so generate and edit no longer thrash each other's
model. The model is passed explicitly so the user's saved default is never
mutated. The settle timeout belongs to the slot's server
(`BaseRuntimeServer.waitUntilSettled`).
