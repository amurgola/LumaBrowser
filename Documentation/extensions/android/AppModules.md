# AppModules

`extensions/android/AppModules.js`

Loads an npm package that ships with the app, wherever this add-on is installed.

## Methods

- `AppModules.load(name, { roots, requireFrom })`: a plain `require` first; when the package is missing there,
  `<root>/node_modules/<name>` for each of `roots` and then `appRoots()`. An error inside a package is rethrown,
  never passed off as missing.
- `AppModules.appRoots()`: `LUMA_APP_ROOT` (a dev override), the Electron app path (`app.asar` in a packaged
  build), then `resources/app.asar`.

## Why

The add-on is `distributable`: it is taken out of `app.asar` and installed into userData, where no `node_modules`
sits above it. `express`, `ws` and the Tango packages stay dependencies of the app itself (the root
`package.json`), as `ws` and `node-turn` do for Tab Share, and are found from the running app's root. Checked
2026-11-24 with a copy of the add-on outside the repo and `LUMA_APP_ROOT` pointing at it: Tango, express and ws
all loaded.
