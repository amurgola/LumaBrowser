# ImageRuntimeDetector

`core/image-server/runtimes/ImageRuntimeDetector.js`

The image server's runtime detector: [RuntimeDetector](../../shared/runtime/RuntimeDetector.md)
bound to [ImageRuntimeCatalog](ImageRuntimeCatalog.md) and the `image-inference` kind.

## Methods

- `new ImageRuntimeDetector(catalog?)`; `catalog` defaults to a new
  `ImageRuntimeCatalog`. `ImageRuntimeDetector.shared` is the app instance.
- `detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries })` (inherited)
  resolves `{ runtimesRoot, platformKey, runtimes }`; every row also carries
  `protocol` (the entry's, else `sd-cpp-http`).
- `parseVersionOutput(stdout, stderr)` returns the first non-empty line of
  stdout plus stderr, or `null`.
- `ImageRuntimeDetector.DEFAULT_PROTOCOL` is `sd-cpp-http`.

## Why

sd-server's `--version` output is less stable than llama.cpp's, so any first
line is accepted as the label. The protocol tag lets the image router pick its
adapter through [ImageAdapterRegistry](../server/image/ImageAdapterRegistry.md)
straight from a detected row. `sd-cpp-cuda12` declares `platforms: ['win32']`,
so it never appears (and can never read as ready) on Linux.

The test runs `RuntimeDetectorContract`.
