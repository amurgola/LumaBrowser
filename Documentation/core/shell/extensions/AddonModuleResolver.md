# AddonModuleResolver

`core/shell/extensions/AddonModuleResolver.js`

Lets an add-on installed in the user extensions dir (`<userData>/extensions/<id>`) require what it
would reach when bundled (`<app>/extensions/<id>`). Add-ons are zipped as plain copies of their
folder, so before this an installed add-on that required core by relative path
(`require('../../core/database/RecordId')`) or an app package (`require('express')`) failed to
activate: in the 2026-11-24 fresh-install run of the packaged build, 10 of the 22 add-ons
(timed-tasks, page-change-detector, personal-hub, site-apis, tool-forge, desktop-integration,
lora-trainer, cdp-driver, selenium-driver, game-mode).

## Methods

- `new AddonModuleResolver({ addonsDir, bundledDir, moduleApi? })`: the user extensions dir and the
  app's extensions dir (its parent is the app root, `app.asar` when packaged).
- `install()`: wraps Node's `Module._resolveFilename` once. Every request resolves as usual first;
  only a `MODULE_NOT_FOUND` from a module inside `addonsDir` gets one more try:
  - a relative path that leaves the add-on's own folder is rebased onto `bundledDir`
    (`../../core/x` -> `<app>/core/x`, `../ui-kit/y` -> `<app>/extensions/ui-kit/y`); an installed
    sibling add-on is found where it is by the first try; a missing file inside the add-on stays missing;
  - a package name is looked up from the app root (`paths: [<app>]`).
  When the retry fails too, the original error is thrown, so the message names the original request.
- `uninstall()`: restores the loader (tests).
- `fallback(request, parent)`: the retry as `{ request, options }`, or null.

## Wiring

[ExtensionHost](../../../app/services/ExtensionHost.md) installs it before the ExtensionManager is
built. The per-add-on helpers that solved the same problem one extension at a time (`CoreRequire` in
roleplay-mode, game-mode and others, `AppModules` in android) still work and are no longer required.
