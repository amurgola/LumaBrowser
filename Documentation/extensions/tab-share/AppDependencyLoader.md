# AppDependencyLoader

`extensions/tab-share/AppDependencyLoader.js`

Requires an npm package that ships with the app (express, ws, node-turn)
wherever Tab Share is installed.

## Methods

- `AppDependencyLoader.load(name, { roots })`: a bare `require(name)` first.
  On `MODULE_NOT_FOUND` only, tries `<root>/node_modules/<name>` for each of
  `roots` (tests), `LUMA_APP_ROOT` (dev override), Electron's
  `app.getAppPath()` (app.asar when packaged), and
  `process.resourcesPath/app.asar`. A real load error inside a dependency is
  rethrown, never masked as missing; if nothing resolves, the last
  `MODULE_NOT_FOUND` is thrown.

## Why

Tab Share is `distributable`: as a sideloaded add-on it lives under userData,
whose parents have no node_modules, so a bare require fails. This is also why
it never requires core by relative path.
