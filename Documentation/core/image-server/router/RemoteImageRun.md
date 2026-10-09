# RemoteImageRun

`core/image-server/router/RemoteImageRun.js`

[ImageRun](ImageRun.md) for a render on a remote image server (a Network
Sharing peer) through [RemoteImageAdapter](../server/image/RemoteImageAdapter.md).

## Methods

- `new RemoteImageRun({ role, send, notify, server, request })`: `server` is the
  active remote entry `{ name, endpoint, token, selectedModel }`, `request` the
  caller's generate arguments.
- `start()` sends `status { phase: 'remote', server: name || endpoint }`,
  notifies `<progress> on "<name>"...`, then builds
  `new RemoteImageAdapter({ baseUrl: endpoint, token, role })` (a constructor
  error sends `error` and resolves the failure without a render) and relays
  `{ model: selectedModel || null, prompt, negativePrompt, width, height, steps,
  cfgScale, seed, sampler, scheduler, strength, initImage, refImages, mask }`.
  - `onMeta`, `onStatus`, `onProgress` are re-emitted; `onPreview` only with `b64`.
  - `onDone({ images, modelId })` notifies `<done> in N.Ns (remote)`, sends
    `done` with the host's images as received, and resolves
    `{ success: true, images }` converted to `{ bytes, mime, width, height, seed }`.

## Why

The host runs the request on its own ImageRouter, so model load, cold start and
VRAM all live there; this only relays. Local model ids mean nothing on the host,
so the model is the one picked for that server. There is no local idle hold:
pasting one in here once made every remote render throw before a request was sent.
LoRAs, sigma nodes, cache options and refArea are not relayed (as in legacy).
