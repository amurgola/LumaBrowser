# CoreRequire

`extensions/basalt-runtime/CoreRequire.js`

Loads a LumaBrowser core module from this add-on wherever it is installed.

## Methods

- `CoreRequire.load(relFromCoreRoot)` requires `<repo>/core/<rel>` relative to
  this file (dev, bundled). Only on `MODULE_NOT_FOUND` does it fall back to
  `<app.getAppPath()>/core/<rel>`; any other load error is rethrown.

## Why

A distributable add-on is sideloaded into the writable userData extensions dir,
where `../../core/...` points at nothing. Each add-on zip is packaged on its own
(`tools/build/addons/AddonPackager`), so this bootstrap cannot be shared with
the other add-ons that carry it (ninfer-runtime, chatterbox-voice, code-mode,
model-testing, roleplay-mode): it is the one piece every add-on copies, because
it is what reaches the shared code in core.
