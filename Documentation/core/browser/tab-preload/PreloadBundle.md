# PreloadBundle

`core/browser/tab-preload/PreloadBundle.js`

Joins a preload script and the local files it requires into one self-contained
file. [TabSurfaces](../../../app/browser/TabSurfaces.md) bundles
[webview-preload.js](../../../webview-preload.md) (a dozen small modules) into
`<data dir>/preload/tab-preload.js` on every boot, and web tabs load that file.

## Methods

- `PreloadBundle.write(entryFile, outFile)` writes the bundle of `entryFile` to
  `outFile` (creating its folder) and returns `outFile`.
- `PreloadBundle.build(entryFile)` the bundle's source: every file reachable from
  the entry through relative requires (`require('./x')`, `require('../x')`,
  matched by `LOCAL_REQUIRE`), each wrapped as a `function (module, exports, require)`
  with a table of its own requests, and loaded on first require like CommonJS
  (one cached `module.exports` per file). A request is resolved as the path
  itself, then `.js`, then `index.js`; one that resolves to nothing throws
  `PreloadBundle: cannot resolve ...`. Requires of anything that is not a
  relative path (`electron`) are left to the host's `require`. The bundle opens
  with a "Generated at startup ... Do not edit." comment.

## Why

A sandboxed renderer's preload can require nothing but `electron`. Web tabs run
in Chromium's sandbox (see [TabViewFactory](../tab-view/TabViewFactory.md)), so
the tab preload has to be one file. Bundling at boot keeps the preload's source
split into classes while a change to any of them still applies on the next
start. Only the static `require('./...')` form is followed, so the modules
reachable from the preload must use plain relative requires and no Node APIs.
