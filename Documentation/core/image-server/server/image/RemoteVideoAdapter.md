# RemoteVideoAdapter

`core/image-server/server/image/RemoteVideoAdapter.js`

Video adapter for another machine's video slot through the Network Sharing
proxy (`protocolId: 'luma-sharing-video'`). A
[RemoteImageAdapter](RemoteImageAdapter.md) fixed to the `image-video` role: the
host runs the request on its own VideoRouter (cold start, VRAM, the model
grid); this only marshals the clip request and re-emits the host's NDJSON
events over the same pinned TLS connection the image adapter uses.

## Methods

- `new RemoteVideoAdapter({ baseUrl, token? })`: `baseUrl` is the peer's video
  root (`https://host:port/sharing/video`); `token` the pairing bearer token.
- `generate(request)` posts to `<baseUrl>/generate` with `{ model (null lets
  the host pick), prompt, negativePrompt, width, height, steps, cfgScale, seed,
  sampler, scheduler, videoFrames, durationSec, fps, flowShift, firstFrame,
  lastFrame }` (frames as base64 through `ImageBytes.toBase64`) and
  `Accept: application/x-ndjson`; returns `{ abort }`. Events arrive through
  [RemoteImageStream](RemoteImageStream.md); `onDone` receives the host's
  `{ video: { b64, mime, frameCount, fps, width, height, encoder }, modelId }`.
- `healthCheck()` probes the host's `GET /sharing/info` from the video root.
- Stream errors name the peer `remote video server` (`NOUN`).
- Statics `ROLE`, `SLOT` (`video`), `NOUN`.

## Why

The pinned `httpsAgent` from [PinnedTls](../../../network-sharing/tls/PinnedTls.md)
and the stream reader are inherited unchanged, so a video request is encrypted
and authenticated exactly like an image request. There is no request timeout:
a clip can take many minutes.
