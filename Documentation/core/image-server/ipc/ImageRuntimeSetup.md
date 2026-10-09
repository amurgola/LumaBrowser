# ImageRuntimeSetup

`core/image-server/ipc/ImageRuntimeSetup.js`

The image runtimes section: cached view, update check, locating or registering an sd.cpp binary, install and uninstall.

## Methods

- `new ImageRuntimeSetup({ imageServerService, installer?, catalog?, pickPath? })` (defaults: `ImageRuntimeInstaller.shared`, `new ImageRuntimeCatalog()`, `PathPicker.pick`).
- `view(opts)` `{ view }`; `{ force: true }` drops the snapshot.
- `checkUpdates()` `{ updates }` from `RuntimeUpdateChecker.check` (kind `image-inference`, a per-instance cache, five minutes per repo).
- `locate(event, runtimeId)` picks a folder, finds the catalog's binary names in it (`BinaryLookup.findBinaryIn`) and registers it: `{ binaryPath, dir }`, `{ success: true, canceled: true }`, or throws (`runtimeId is required`, `Unknown runtime: <id>`, or `No <name> executable (<names>) found in that folder.` with `notFound: true`).
- `register(runtimeId, binaryPath)` no path clears (`{ cleared: true }`); otherwise the path must be accessible (`Path not accessible: <path>`).
- `install(id, send)` sends `start`, streams installer events, drops the cache before `finalize` goes out and again after; resolves `{ result }`. A failure sends `error { message, code, detail }` and throws with `code` / `detail` (null when absent).
- `uninstall(id)` the installer's result, cache dropped.

## Why

`finalize` is the renderer's cue to refetch the view, so the snapshot must already be gone when it is sent; otherwise the refetch can be served the pre-install view.
