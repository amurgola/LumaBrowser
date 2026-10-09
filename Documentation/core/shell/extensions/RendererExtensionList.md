# RendererExtensionList

`core/shell/extensions/RendererExtensionList.js`

The serialisable list of every discovered extension the renderer builds its UI from.

## Methods

- `RendererExtensionList.build(ledger, disabled)` returns one row per manifest
  (HTML files inlined first): `id, name, version (default 1.0.0), description,
  dir, userInstalled, debugOnly, private, distributable (classic renderer scripts), ui, renderer, navigationBar, settings,
  setupTab ({ label } or null), extensionsAction, extensionsActions,
  dependencies, loadOrder (index or -1), enabled, loadable, unmetDependency`.
  Each dependency is `{ key, name, isCore, isRequired, installed, reason, hasSlots }`
  (core names labelled `Browser`, `Database`, `LLM Service`; an `ext:` dep is
  installed when discovered). Sorted enabled first, then by load order.

## Why

`loadable` is false for an enabled extension whose main side never activated
(unmet dependency): its IPC handlers do not exist, so the shell must not run
its UI. `userInstalled` tells the renderer to inject the script over IPC
(outside the bundled file:// origin).
