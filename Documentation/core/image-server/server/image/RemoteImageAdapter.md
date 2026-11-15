# RemoteImageAdapter

`core/image-server/server/image/RemoteImageAdapter.js`

[ImageAdapter](ImageAdapter.md) for another machine's image server through the
Network Sharing proxy (`protocolId: 'luma-sharing-image'`). The host runs the
request on its own ImageRouter (cold start, model load, VRAM coordination,
coalescing); this adapter only marshals params and re-emits the host's events.

## Methods

- `new RemoteImageAdapter({ baseUrl, token?, role? })`: `baseUrl` is the
  peer's image root (`https://host:port/sharing/image`); `token` is the pairing
  bearer token (kept as `apiKey`, also readable as `token`); `role` is
  `'image-edit'`, anything else means `'image-generate'`.
- `generate(request)` posts to `<baseUrl>/generate` or `<baseUrl>/edit` with
  `{ model (null lets the host pick), prompt, negativePrompt, width, height,
  steps, cfgScale, seed, sampler, scheduler, strength, initImage, mask,
  refImages, slot }` (images as base64) and `Accept: application/x-ndjson`, and
  returns `{ abort }`. Events arrive through [RemoteImageStream](RemoteImageStream.md);
  `onMeta` and `onStatus` are extra callbacks beside the base ones. A request
  error fails with its message unless aborted. `_streamNoun()` names the peer
  in stream errors (`remote image server`; [RemoteVideoAdapter](RemoteVideoAdapter.md)
  overrides it).
- `healthCheck()` resolves true when the host's unauthenticated
  `GET /sharing/info` answers 2xx (3 s timeout), false otherwise. Never throws.

Wire format, one JSON object per line: `meta`, `status { phase }`,
`progress { step, totalSteps }`, `preview { b64, mime }`,
`done { images: [{ b64, mime, width, height, seed }], modelId }`, `error { message }`.
The payloads are exactly what the host's ImageRouter passes to its own `send`.

## Why

A pinned `httpsAgent` from [PinnedTls](../../../network-sharing/tls/PinnedTls.md)
is used when the peer's self-signed certificate was pinned at pairing; other
endpoints keep normal TLS. There is no request timeout: a remote render can take minutes.

Legacy was duck-typed; it now extends `ImageAdapter` as the level-0 porter
asked, which added `protocolId` and `healthCheck`. `healthCheck` is new
behaviour with no legacy caller; it probes the host's documented liveness route.
All trailing slashes of `baseUrl` are stripped (legacy stripped one).

## Changes (2026-11-14, exact size crosses)

`_body` carries `snapNative` only as an explicit `false`; left unsaid the field is absent and the host decides. A caller's "render exactly this size" used to be dropped between a client and its host, so the host snapped an edit to the model's native size; the roleplay turns that snap off on purpose for figure renders. A side-by-side of the same request on a host and through a paired client now shows every generation parameter equal; the client's request differs only in `slot` (always named) and `forceLocal`.
