# RendererScriptLoader

`core/shell/ui/extensions/RendererScriptLoader.js` (ES module)

Loads an extension's renderer so it publishes `window.__ext_<id>`: module script for bundled extensions, classic script for bundled `distributable: true` ones, inline classic script over IPC for user-installed ones.

## Methods

- `RendererScriptLoader.mode(ext)`: `'inline'` (`userInstalled`), `'classic'`
  (`distributable === true`), `'module'`.
- `RendererScriptLoader.src(ext)`: `extensions/<folder after /extensions/>/<renderer without ./>`.
- `load(ext)`: no-op when the global exists; inline reads
  `core.shell.getExtensionRendererSource(id)` (`{ success, content, error }`) and
  appends `<script data-ext>` with the text; file modes append
  `<script data-ext src [type=module]>` and resolve on load, reject with
  `Failed to load script: <src>`. A module loaded again after a purge gets
  `?reload=<n>` (module URLs evaluate once per page).

## Dependency on the extension list

The `distributable` flag must be in the renderer extension list rows. Until
core's RendererExtensionList adds it (change request filed), every bundled
renderer loads as a module, which breaks the classic distributable renderers
(roleplay-mode, tab-share) in a checkout where they are bundled.

## Globals

Reads `window.ipcBridge.invoke`; checks `window.__ext_<id>`.
