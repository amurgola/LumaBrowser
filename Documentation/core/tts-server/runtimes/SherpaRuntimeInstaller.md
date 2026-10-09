# SherpaRuntimeInstaller

`core/tts-server/runtimes/SherpaRuntimeInstaller.js`

Installs the sherpa-onnx Node addon (N-API, Electron-safe without a rebuild)
from the public npm registry, with no npm CLI involved.

## Methods

- `new SherpaRuntimeInstaller().install({ runtimesRoot, onEvent? })` downloads
  and extracts `sherpa-onnx-node` then the host's platform package (via
  `TarballDownloader`, staging in `<runtimesRoot>/.tmp`), writes
  `tts-sherpa/manifest.json` (`{ id, version, platformPackage, installedAt }`)
  and resolves that manifest. Each package destination is wiped before
  extraction. Events through `onEvent(type, payload)`:
  `resolved` (`{ version, packages }`), `download` (`{ pkg, received, total }`),
  `extract` (`{ pkg, phase: 'start'|'done' }`), `finalize` (the manifest).
  A throwing listener is ignored.
- An unsupported host rejects before any download with
  `code: 'NO_ASSET_FOR_PLATFORM'`, `detail: { platform, arch }`.

## Why

IMPORTANT (licensing): the prebuilt binaries statically include espeak-ng
(GPL-3.0). They are downloaded only at the user's explicit request and must
never be bundled into the LumaBrowser installer; see THIRD-PARTY-LICENSES.
