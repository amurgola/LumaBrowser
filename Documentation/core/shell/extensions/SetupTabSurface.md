# SetupTabSurface

`core/shell/extensions/SetupTabSurface.js`

`context.setupTab`: a runtime-registered Setup-area tab and the handler its UI calls.

## Methods

- `new SetupTabSurface({ registry = SetupTabRegistry.shared })`; `key` is `setupTab`.
- `forExtension(id)` -> `{ register({ id?, label?, file?, url?, group? }), unregister(tabId), onInvoke(fn), uiUrl(relPath) }`
  (`group` as in [SetupTabRegistry](../../llm-server/chat/SetupTabRegistry.md)).
  `register` defaults the tab id to the extension id and derives `url` from
  `file` via [ExtensionUrls](ExtensionUrls.md). `onInvoke(fn)` sets the
  `setup.invoke` handler `fn(action, payload)`.

Tabs declared statically in `manifest.setupTab` are registered by [ExtensionWiring](ExtensionWiring.md).
