# LocalImageRun

`core/image-server/router/LocalImageRun.js`

[ImageRun](ImageRun.md) for a render on this machine's image slot.

## Methods

- `new LocalImageRun({ role, send, notify, adapter, server, plan, wantId, cold?, startedAt? })`:
  `adapter` is an [ImageAdapter](../server/image/ImageAdapter.md), `server` the
  slot's runtime server, `plan` the [ImageRequestPlanner](ImageRequestPlanner.md)
  output, `startedAt` when the request arrived.
- `start()` notifies `<progress> with "<wantId>"...`, takes the slot's
  `holdIdle()` (when present) and calls `adapter.generate({ ...plan.params, callbacks })`.
  - `onPreview({ bytes, mime })` sends `preview { b64, mime }` (no bytes: dropped).
  - `onDone({ images })` calls `server.markActive()`, logs the timing, notifies
    `<done> in N.Ns`, sends `done { images: [{ b64, mime, width, height, seed }], modelId }`
    and resolves `{ success: true, images }` with the adapter's raw images.
  - The idle hold is released once on every outcome.

## Why

A render longer than the idle window (FLUX on a CPU runtime took 14 minutes at
1024px) must not be unloaded mid-generation. The idle countdown restarts from
completion. The console line says COLD (incl. model load) or warm so a user can
watch reruns get fast once a model sticks.
