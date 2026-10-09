# ImageRuntimeInstaller

`core/image-server/runtimes/ImageRuntimeInstaller.js`

The image server's runtime installer: [RuntimeInstaller](../../shared/runtime/RuntimeInstaller.md)
bound to [ImageRuntimeCatalog](ImageRuntimeCatalog.md), the
`LumaBrowser-ImageServer` User-Agent and the `image-inference` kind (error
wording `image inference`).

## Methods

- `new ImageRuntimeInstaller({ catalog?, http?, sysdeps?, extractor? })`; the
  catalog defaults to a new `ImageRuntimeCatalog`, the rest are the base's test
  seams. `ImageRuntimeInstaller.shared` is the app instance.
- Inherited: `installRuntime`, `uninstallRuntime`, `fetchLatestRelease`,
  `fetchLatestPrerelease`, `resolvePrerelease`, `expectedKind`, `userAgent`.
- `ImageRuntimeInstaller.USER_AGENT` is `LumaBrowser-ImageServer`.

## Why

The image server installs stable-diffusion.cpp from GitHub releases exactly
like the LLM server installs llama.cpp; only the catalog and identity differ.
On a platform without a prebuilt asset, sd.cpp rows carry a `manualSourceUrl`,
so the install fails with `MANUAL_SOURCE_ONLY` (build from source) before any
network call. The test runs `RuntimeInstallerContract`.
