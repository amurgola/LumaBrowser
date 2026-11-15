# SharedImageJob

`core/network-sharing/host/media/SharedImageJob.js`

`POST /sharing/image/generate` and `/edit`: runs one client image request on
the host's own local image slot and streams its events as NDJSON. A
[SharedMediaJob](SharedMediaJob.md); the video twin is
[SharedVideoJob](SharedVideoJob.md).

## Methods

- `new SharedImageJob(service, role)` (`'image-generate'` or `'image-edit'`,
  also `SharedImageJob.GENERATE_ROLE` / `EDIT_ROLE`); `run(req, res)`.

## Behaviour

1. Refusals before streaming (`{ error }`): 403 `image editing is not shared` /
   `image generation is not shared`; 503 `host image server is not ready`;
   a named `model` that `service.imageModelDenied` rejects is a 403.
2. Streams `application/x-ndjson` lines `{ type, payload }` from the image
   router's `send`. The run is queued FIFO through `service.enqueueImage`.
3. Calls `generate({ modelRef, prompt, negativePrompt, width, height, steps,
   cfgScale, seed, sampler, scheduler, initImage, strength, refImages, mask,
   slot, forceLocal: true, send })`; no `model` means the host default.
4. A thrown run sends an `error` line. Finally the images of `done` events are
   banked as usage and the response ends.
5. A client disconnect before the end aborts the image router once the job has
   started; a still-queued job only resolves `{ success: false, aborted: true }`
   without running (and without aborting someone else's render).

## Why

`forceLocal` serves the host's own slot, never a remote image server the host
picked as its own backend. Abort listens to the response closing, because
`req` `close` fires once the body is read and used to abort every request.

## Changes (2026-11-14, exact size crosses)

`_generateOnRouter` passes `snapNative: false` through when the client asked for it. A caller's "render exactly this size" used to be dropped between a client and its host, so the host snapped an edit to the model's native size; the roleplay turns that snap off on purpose for figure renders. A side-by-side of the same request on a host and through a paired client now shows every generation parameter equal; the client's request differs only in `slot` (always named) and `forceLocal`.
