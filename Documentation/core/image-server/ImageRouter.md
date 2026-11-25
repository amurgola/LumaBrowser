# ImageRouter

`core/image-server/ImageRouter.js`

The single entry point for image generation and editing. A facade over the
classes in [router/](router/): it routes a request to a remote peer or to the
right local slot, makes that slot run the model, plans the parameters and
streams the render's events to the caller's `send`.

## Methods

- `new ImageRouter({ imageServerService, notify?, scanner?, presize? })`.
  Throws `ImageRouter: imageServerService is required` without the service.
  `notify(message, level)` feeds the notification log (no-op when omitted).
  `scanner` ([ImageModelsScanner](ImageModelsScanner.md)) and `presize`
  ([RefImagePresizer](RefImagePresizer.md)`.presize`) are test seams.
- `generate(request)` resolves `{ success, images?, error?, aborted? }`.
  Request fields: `prompt` (required), `modelRef` (`local::` tolerated; null is
  the configured default), `negativePrompt`, `width`, `height`, `steps`,
  `cfgScale`, `seed`, `sampler`, `scheduler`, `initImage`, `strength`,
  `refImages`, `mask`, `loras`, `sigmaNodes`, `refArea`, `cacheMode`,
  `cacheOption`, `slot` (`'edit'` / `'generate'`), `forceLocal`, `snapNative`,
  `send(type, payload)`. Events: `meta`, `status { phase }` (the launcher's
  `starting-server` / `switching-model`, then `rendering-image` right before
  `meta` on the local path), `progress { step, totalSteps }`, `preview { b64, mime }`,
  `done { images: [{ b64, mime, width, height, seed }], modelId }`, `error { message }`.
  A missing prompt or no configured model returns an error without an event;
  every later failure also sends `error`. Local images resolve as
  `{ bytes, mime, width, height, seed }`; remote ones are converted to that shape.
- `abort()` aborts the render in flight; returns `{ success: true }`.
- `getModelNativeSize(modelRef?)`, `getFrameSizes(modelRef?, picks?)`,
  `getActivePromptInfo(role?, picks?)`: see [ImageModelInfo](router/ImageModelInfo.md).
- `getEditPromptInfo(picks?)`: see [ImageEditPromptInfo](router/ImageEditPromptInfo.md).
  `picks` is the caller's own model per job
  ([ImageModelPicks](router/ImageModelPicks.md)), standing in for the Setup
  defaults; `generate` itself takes the model as `request.modelRef`.

The service must provide `getDefaults()`, `getModelsDirConfig()`,
`serverForRole(role)`, `startServerResolved(id, { role })`, and optionally
`getActiveServer(role)` and `getApiKeyForLaunch()`. Slot servers are
[BaseRuntimeServer](../shared/runtime/BaseRuntimeServer.md)s
(`getStatus`, `stop`, `markActive`, `holdIdle`, `waitUntilSettled`).

## Flow

1. Refuse a missing prompt; abort the previous render (one in flight at a time,
   matching the chat router and the user's "Stop").
2. Unless `forceLocal`, an active remote server for the slot's role runs the
   request through [RemoteImageRun](router/RemoteImageRun.md); no local state is touched.
3. Resolve the model id, its record, the request's role and the serving slot
   ([ImageSlotPicker](router/ImageSlotPicker.md)).
4. [ImageSlotLauncher](router/ImageSlotLauncher.md) makes that slot run the model.
5. [ImageRequestPlanner](router/ImageRequestPlanner.md) resolves the parameters;
   `meta` reports what actually runs.
6. [LocalImageRun](router/LocalImageRun.md) drives the adapter from
   [ImageAdapterRegistry](server/image/ImageAdapterRegistry.md) at
   `http://127.0.0.1:<port>` with the first launch API key.

## Why

`role` (what the request means: labels, notifications) and `slotRole` (the
supervisor that serves it) differ for a unified generate+edit model pinned as
both defaults, so the same weights are never loaded on both slots. The model
record is resolved before the slot is started (for kind routing) but a missing
record is only reported once the slot is ready, as legacy did.

## Changes (2026-11-25, a render that ran out of room)

A local render that fails, or comes back done with no image (how sd-server reports a job it could not run, as the
live edit failure did), with sd.cpp's out-of-room signature in its own log lines is tried once more: [ImageCapacityRescue](router/ImageCapacityRescue.md)
records the model's need (its launch budget plus 1 GiB) and stops its slot, and the second attempt launches the slot
again with that need, so it lands on a card that holds it or the chat model is swapped out. The first attempt's `error`
event and failure notification are held ([HeldRunEvents](router/HeldRunEvents.md)) and only go out when no retry
follows. There is never a third attempt.
