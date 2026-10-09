# SetupTabSurface

`core/shell/extensions/SetupTabSurface.js`

`context.setupTab`: a runtime-registered Setup-area tab and the handler its UI calls.

## Methods

- `new SetupTabSurface({ registry = SetupTabRegistry.shared })`; `key` is `setupTab`.
- `forExtension(id)` -> `{ register({ id?, label?, file?, url? }), unregister(tabId), onInvoke(fn), uiUrl(relPath) }`.
  `register` defaults the tab id to the extension id and derives `url` from
  `file` via [ExtensionUrls](ExtensionUrls.md). `onInvoke(fn)` sets the
  `setup.invoke` handler `fn(action, payload)`.

Tabs declared statically in `manifest.setupTab` are registered by [ExtensionWiring](ExtensionWiring.md).
