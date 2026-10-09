# LlmRuntimeSetup

`core/llm-server/ipc/LlmRuntimeSetup.js`

The LLM runtimes section: cached view, update and pre-release checks,
registering or locating a llama.cpp build, install and uninstall.

## Methods

- `new LlmRuntimeSetup({ llmServerService, installer?, catalog?, pickPath?, platform? })`
  (defaults `LlmRuntimeInstaller.shared`, `LlmRuntimeCatalog.shared`, `PathPicker.pick`, `process.platform`).
- `view(opts)` `{ view }`; `{ force: true }` is a real rescan.
- `checkUpdates()` `{ updates }` from `RuntimeUpdateChecker.check` (kind
  `inference`, stable and pre-release feeds, a per-instance cache).
- `prerelease(id)` `{ candidate }` from `installer.resolvePrerelease(id)`.
- `pickBinary(event, runtimeId)` the file dialog (`Executable` filter on Windows):
  `{ canceled: true }` or `{ canceled: false, binaryPath }`.
- `register(runtimeId, binaryPath)` no path clears (`{ cleared: true }`); otherwise
  the path must exist (`Path not accessible: <path>`). Drops the runtimes cache.
- `locate(event, runtimeId)` picks a folder, finds the catalog's binary names in it
  (`BinaryLookup.findBinaryIn`) and registers it: `{ binaryPath, dir }`,
  `{ canceled: true }`, or throws `runtimeId is required`, `Unknown runtime: <id>`,
  or `No <name> executable (<names>) found in that folder.` with `notFound: true`.
- `install(id, opts, send)` sends `start`, streams installer events (cache dropped
  before `finalize` goes out and again after), `opts.channel === 'prerelease'`
  selects the pre-release build; resolves `{ result }`. A failure sends
  `error { message, code, detail }` and throws with `code` and `detail` (null when absent).
- `uninstall(id)` the installer's result; cache dropped.
- `LlmRuntimeSetup.channelOf(opts)` `prerelease` or `stable`.

## Why

`finalize` is the renderer's cue to refetch, so the cached view must already be
gone when it goes out. Registering skips a `--version` probe because that can
fail for non-fatal reasons (DLL search order, working directory).
