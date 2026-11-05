# RemoteVideoRun

`core/image-server/video/RemoteVideoRun.js`

[ImageRun](../router/ImageRun.md) for a clip rendered on a remote video server
(a Network Sharing peer) through [RemoteVideoAdapter](../server/image/RemoteVideoAdapter.md).
The host runs it on its own VideoRouter; this only relays the request,
re-emits the host's events and hands the clip back in the local shape.

## Methods

- `new RemoteVideoRun({ send, notify, server, request })`: `server` is the
  active remote entry `{ name, endpoint, token, selectedModel }`, `request`
  the caller's generate arguments.
- `start()` sends `status { phase: 'remote', server: name || endpoint }`,
  notifies `Generating video on "<name>"...` (`Animating image` when a
  `firstFrame` is set), then builds `new RemoteVideoAdapter({ baseUrl:
  endpoint, token })` (a constructor error sends `error` and resolves the
  failure without a render) and relays `{ model: selectedModel || null, prompt,
  negativePrompt, width, height, steps, cfgScale, seed, sampler, scheduler,
  videoFrames, durationSec, fps, flowShift, firstFrame, lastFrame }`.
  - `onMeta`, `onStatus`, `onProgress` are re-emitted; `onPreview` only with `b64`.
  - `onDone({ video, modelId })` notifies `Video generated in N.Ns (remote)`,
    sends `done` with the host's payload as received, and resolves
    `{ success: true, video: { bytes, mime, frameCount, fps, width, height,
    encoder }, modelId }` (webm and nulls for missing fields). A done without
    a clip fails with `remote host returned no video`.
- Wording: `progressLabel`, `doneLabel` (`Video generated`), `nounLabel`
  (`Video generation`).

## Why

The resolved shape matches [VideoRun](VideoRun.md), so the chat's
`generate_video` / `animate_image` handler persists the artifact on this
machine without knowing where the clip was rendered; the host keeps nothing.
Local model ids mean nothing on the host, so the model is the one picked for
that server. LoRAs and model-only knobs are not relayed; the host's planner
applies its own model defaults.
