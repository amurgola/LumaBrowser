# ImageAdapter

`core/image-server/server/image/ImageAdapter.js`

Base class for every image-generation engine adapter. The image router speaks
only this surface; concrete adapters translate it to their backend's wire format.
Sibling of the LLM side's ChatAdapter.

## Methods

- `new ImageAdapter({ baseUrl, apiKey? })` throws without `baseUrl`, strips
  trailing slashes into `this.baseUrl`, and keeps `this.apiKey` only when it is a
  non-empty string.
- `static get protocolId` (abstract) is matched against a runtime catalog entry's `protocol`.
- `healthCheck()` (abstract) resolves a boolean.
- `generate(request)` (abstract) returns `{ abort }` synchronously. Request:
  `prompt`, `negativePrompt?`, `width?`, `height?`, `steps?`, `cfgScale?`,
  `seed?` (null or -1 is random), `sampler?`, `scheduler?`, and callbacks
  `onProgress({ step, totalSteps, elapsedMs? })`, `onPreview({ bytes, mime })`,
  `onDone({ images: [{ bytes, mime, width, height, seed }], usage? })`, `onError(Error)`.
- `_requirePrompt(prompt)` (for subclasses) throws `generate: prompt is required`
  unless `prompt` is a non-empty string.
- `_authHeaders()` (for subclasses) is `{ Authorization: 'Bearer <apiKey>' }` or `{}`.

## Implementations

- [SdCppHttpAdapter](SdCppHttpAdapter.md) (`sd-cpp-http`)
- [SdCppVideoAdapter](SdCppVideoAdapter.md) (`sd-cpp-video`)
- [RemoteImageAdapter](RemoteImageAdapter.md) (`luma-sharing-image`; duck-typed in legacy, now extends this class)

All three run the contract.

## Why

The api key is needed when the upstream `AuthProxy` enforces ApiSecurity keys.
