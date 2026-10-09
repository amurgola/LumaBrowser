# CoreRequire

`extensions/chatterbox-voice/CoreRequire.js`

Loads a LumaBrowser core module from this add-on wherever it is installed.

## Methods

- `CoreRequire.load(relFromCoreRoot)` requires `<repo>/core/<rel>` relative to
  this file; only on `MODULE_NOT_FOUND` falls back to `<app.getAppPath()>/core/<rel>`.

## Why

Same mechanism and reasons as ninfer-runtime's
[CoreRequire](../ninfer-runtime/CoreRequire.md): a sideloaded add-on lives in
userData, where `../../core` points at nothing. Extensions cannot require each
other, so each distributable add-on carries its own copy.
