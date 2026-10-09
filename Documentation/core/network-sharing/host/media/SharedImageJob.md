# SharedImageJob

`core/network-sharing/host/media/SharedImageJob.js`

`POST /sharing/image/generate` and `/edit`: runs one client image request on
the host's own local image slot and streams its events as NDJSON.

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
5. A client disconnect before the end aborts the image router; a still-queued
   job then resolves `{ success: false, aborted: true }` without running.

## Why

`forceLocal` serves the host's own slot, never a remote image server the host
picked as its own backend. Abort listens to the response closing, because
`req` `close` fires once the body is read and used to abort every request.
