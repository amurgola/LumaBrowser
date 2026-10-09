# CoreRequire

`extensions/code-mode/CoreRequire.js`

Resolves a core module from code-mode wherever the extension is installed.

## Methods

- `CoreRequire.require(relFromCoreRoot)` (e.g. `'llm-server/chat/ToolOutputTruncator'`)
  requires `<extension>/../../core/<rel>` (bundled or dev). Only on
  `MODULE_NOT_FOUND` does it fall back to `app.getAppPath()/core/<rel>` (the
  app.asar in packaged builds, where bytecode core loads transparently). Any
  other load error is rethrown, never masked.

## Why

A sideloaded copy lives in the userData extensions dir, where `../../core`
does not exist; activation then threw MODULE_NOT_FOUND and the extension got
stuck pseudo-disabled. Every core require in code-mode goes through here.
