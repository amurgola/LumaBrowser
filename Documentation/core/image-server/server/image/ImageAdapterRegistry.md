# ImageAdapterRegistry

`core/image-server/server/image/ImageAdapterRegistry.js`

Maps a runtime catalog entry's `protocol` to the [ImageAdapter](ImageAdapter.md)
class that speaks its wire format.

## Methods

- `ImageAdapterRegistry.createAdapterFor(runtimeEntry, opts)` returns
  `new AdapterClass(opts)` for `runtimeEntry.protocol` (default `sd-cpp-http`).
  An unknown protocol throws
  `No image adapter registered for protocol "<p>" (runtime <id>).`
- `ImageAdapterRegistry.listProtocols()` returns the registered protocol ids.
- `ImageAdapterRegistry.ADAPTERS` is the frozen protocol-to-class map, built
  from each adapter's static `protocolId`:
  - `sd-cpp-http` -> [SdCppHttpAdapter](SdCppHttpAdapter.md)
  - `sd-cpp-video` -> [SdCppVideoAdapter](SdCppVideoAdapter.md) (Wan / LTX via `/sdcpp/v1/vid_gen`)

## Why

The rest of the image server never grows a per-protocol switch; a new backend
(ComfyUI, a diffusers sidecar) is one new ImageAdapter subclass added to the
list. Keying on `protocolId` keeps the id in one place, on the adapter.
[RemoteImageAdapter](RemoteImageAdapter.md) is not registered: sharing peers
construct it directly, as in legacy.
