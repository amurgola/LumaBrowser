# RendererScriptLoader

`core/shell/ui/extensions/RendererScriptLoader.js` (ES module)

Loads an extension's renderer so it publishes `window.__ext_<id>`. A renderer whose source has import or export statements (`rendererModule` in the list row) loads as a module script: by its path under the app's `extensions/` when bundled, from its installed file URL (`rendererUrl`) under the import map main computed (`rendererImports`, see [AddonRendererModule](../../extensions/AddonRendererModule.md)) when it is an add-on in the user dir. Otherwise: module script for bundled extensions, classic script for bundled `distributable: true` ones, inline classic script over IPC for user-installed ones.

## Methods

- `RendererScriptLoader.mode(ext)`: `'module'` (`rendererModule === true`), else `'inline'`
  (`userInstalled`), `'classic'` (`distributable === true`), `'module'`.
- `RendererScriptLoader.src(ext)`: `extensions/<folder after /extensions/>/<renderer without ./>`.
- `load(ext)`: no-op when the global exists; inline reads
  `core.shell.getExtensionRendererSource(id)` (`{ success, content, error }`) and
  appends `<script data-ext>` with the text; file modes append
  `<script data-ext src [type=module]>` and resolve on load, reject with
  `Failed to load script: <src>`. A module loaded again after a purge gets
  `?reload=<n>` (module URLs evaluate once per page). Before an installed module
  loads, its `rendererImports` go into the page as a `<script type="importmap">`
  holding only the prefixes not mapped yet (Chromium merges the maps, so a second
  add-on adds nothing new).

## Dependency on the extension list

The `distributable`, `rendererModule`, `rendererUrl` and `rendererImports` fields come from
[RendererExtensionList](../../extensions/RendererExtensionList.md). Before 2026-11-24 a
distributable renderer was always classic, so the module renderers of the extensions made
distributable that day (timed-tasks, personal-hub, page-change-detector and others) threw
"Cannot use import statement outside a module", bundled or installed.

## Globals

Reads `window.ipcBridge.invoke`; checks `window.__ext_<id>`.
