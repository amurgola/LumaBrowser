# VideoRouter

`core/image-server/VideoRouter.js`

The single entry point for video generation, the sibling of
[ImageRouter](ImageRouter.md). A facade over the classes in [video/](video/):
it routes a request to a remote peer or resolves the model, refuses a source
frame on a text-to-video model, makes the video slot run the model, plans the
clip and streams the render's events to the caller's `send`.

## Methods

- `new VideoRouter({ imageServerService, notify?, scanner? })`. Throws
  `VideoRouter: imageServerService is required` without the service.
  `notify(message, level)` feeds the notification log; `scanner`
  ([ImageModelsScanner](ImageModelsScanner.md)) is a test seam.
- `generate(request)` resolves `{ success, video?, error?, aborted? }`. Request
  fields: `prompt` (required), `modelRef` (`local::` tolerated; null is the
  `videoModelId` default), `negativePrompt`, `width`, `height`, `steps`,
  `cfgScale`, `seed`, `sampler`, `scheduler`, `videoFrames`, `durationSec`
  (ignored when `videoFrames` is set; capped at 15 s), `fps`, `flowShift`,
  `firstFrame` / `lastFrame` (Buffer or base64; resolving an artifact id to bytes
  is the caller's job), `forceLocal` (the Network Sharing host proxy: never
  route to a peer), `send(type, payload)`. Events: `meta { modelId,
  runtimeId, port, width, height, steps, cfgScale, sampler, videoFrames, fps,
  seed, i2v, adjustments? }`, `status { phase }` (the launcher's
  `starting-server` / `switching-model`, then `rendering-video` right before
  `meta`, so the chat bubble stops saying the model is starting), `progress { step, totalSteps }`,
  `preview { b64, mime }`, `done { video: { b64, mime, frameCount, fps, width,
  height, encoder }, modelId }`, `error { message }`. A missing prompt or no
  configured model returns an error without an event; every later failure also
  sends `error`.
- `abort()` aborts the render in flight; returns `{ success: true }`.
- `VideoRouter.NO_MODEL` the no-default message.

The service must provide `getDefaults()`, `getModelsDirConfig()`,
`serverForRole('image-video')`, `startServerResolved(id, { role })` and
optionally `getApiKeyForLaunch()`.

## Flow

1. Refuse a missing prompt; abort the previous render (one at a time).
2. When the service's `getActiveServer('image-video')` is a `location:
   'remote'` entry (a paired peer's shared video slot) and `forceLocal` is not
   set, hand the request to [RemoteVideoRun](video/RemoteVideoRun.md): nothing
   below runs on this machine, and the clip comes back in the local shape.
3. Resolve the model id and record ([ImageModelResolver](router/ImageModelResolver.md)).
   An unknown model, or a `firstFrame` on a model with `supportsI2V === false`,
   is refused before any server work.
4. An I2V request with no size gets its canvas refitted to the frame's aspect
   ([VideoFrameFit](video/VideoFrameFit.md)).
5. [VideoSlotLauncher](video/VideoSlotLauncher.md) makes the `image-video` slot run the model.
6. [VideoRequestPlanner](video/VideoRequestPlanner.md) resolves the parameters
   and snaps them to the model grid; `meta` reports what actually renders.
7. [VideoRun](video/VideoRun.md) drives the `sd-cpp-video` adapter from
   [ImageAdapterRegistry](server/image/ImageAdapterRegistry.md) at
   `http://127.0.0.1:<port>` with the first launch API key.

## Why

sd.cpp only wires `init_image` into I2V / TI2V / FLF2V checkpoints; on a
text-to-video model the frame is silently dropped and the clip is unrelated to
the image, so the gate refuses loudly instead. The video slot is a third
sd-server supervisor, so starting or switching the video model never touches the
generation or edit slots.
