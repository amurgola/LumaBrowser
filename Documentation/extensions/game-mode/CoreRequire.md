# CoreRequire

`extensions/game-mode/CoreRequire.js`

Loads a LumaBrowser core module from game-mode wherever the extension is installed. Every core class game-mode uses goes through it.

## Methods

- `CoreRequire.load(relFromCoreRoot)` requires `core/<rel>` beside the extension (`../../core`, dev and bundled); on `MODULE_NOT_FOUND` only, it retries under `app.getAppPath()/core` (packaged builds load the `.jsc` bytecode through bytenode). Any other load error is rethrown, never masked.

## Why

A sideloaded copy lives in userData, where `../../core` does not exist. The mechanism is kept from legacy even though the manifest says `distributable: false`, so a sideload still works. Paths now point at rebuild classes: `shared/fs/ContainedPath`, `shared/llm/BalancedJson`, `shared/runtime/CudaDeviceProbe`, `shared/llm/ContextBudget`, `shared/text/Slug`, `shell/FileObservation`, `llm-server/chat/ToolOutputTruncator`, `llm-server/chat/web-tools/PageReader`.
