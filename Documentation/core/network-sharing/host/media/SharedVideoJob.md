# SharedVideoJob

`core/network-sharing/host/media/SharedVideoJob.js`

`POST /sharing/video/generate`: runs one client video request on the host's
own local video slot and streams its events as NDJSON. A
[SharedMediaJob](SharedMediaJob.md).

## Methods

- `new SharedVideoJob(service)`; `run(req, res)`.
- Statics `ROLE` (`image-video`), `NOT_SHARED`, `NOT_READY`.

## Behaviour

1. Refusals before streaming (`{ error }`): 403 `video generation is not shared`
   (the `shareVideoGen` flag); 503 `host video server is not ready` (no
   `service.getVideoRouter()`); a named `model` that
   `service.imageModelDenied('image-video', model)` rejects is a 403.
2. Queued FIFO through `service.enqueueVideo` (its own lane, so a long clip
   never holds up client image requests).
3. Calls the video router's `generate({ modelRef, prompt, negativePrompt,
   width, height, steps, cfgScale, seed, sampler, scheduler, videoFrames,
   durationSec, fps, flowShift, firstFrame, lastFrame, forceLocal: true, send })`;
   no `model` means the host default. Frames arrive base64.
4. Usage banks one `videos` per `done` event that carried a `video.b64`.

Wire format, one JSON object per line: exactly what
[VideoRouter](../../../image-server/VideoRouter.md) passes to `send` (`meta`,
`status`, `progress`, `preview`, `done { video: { b64, mime, frameCount, fps,
width, height, encoder }, modelId }`, `error`).

## Why

`forceLocal` serves the host's own video slot, never a peer the host itself
picked as its video backend (sharing is not transitive). The clip is never
persisted here: the client's own `generate_video` / `animate_image` handler
stores the artifact on the client, exactly as it does for a local render.
