# DashboardContribution

`core/shell/extensions/DashboardContribution.js`

Reads an extension manifest's `dashboard` contribution: the widgets it offers
the Dashboard (each optionally naming the API method that describes it to the
chat), the sibling assets those widget modules import, and the public API
methods the Dashboard page and live modules may call on it.

## Manifest shape

```js
dashboard: {
  widgets: [{ id: 'board', title: 'Task board', file: './ui/widgets/HubBoardWidget.js', w: 8, h: 5, context: 'widgetContext' }],
  assets: ['./ui/widgets/HubWidgetBase.js'],   // every module a widget imports by relative URL
  api: ['listTasks', 'moveTask'],               // methods of the activate() API that renderers may call
}
```

`context` (optional) names the activate() API method the chat's `@dashboard`
calls for the widget's text, with `{ widgetId, rootId, title }`; it returns a
string or `{ text, title? }`. It need not be in `api`.

## Methods (static)

- `block(manifest)`: the dashboard block or `{}`.
- `widgets(manifest)`: `[{ id, title, file, w, h, context }]`, valid entries
  only (a kebab-case `id`, a string `file`; `title` defaults to the id; `w`/`h`
  default 4/4 and are clamped to 1..12 and 1..99; `context` is the trimmed
  method name or null).
- `contextMethod(manifest, widgetId)`: that widget's `context`, null for a
  widget without one or an unknown id.
- `apiMethods(manifest)`: trimmed method names; `allowsMethod(manifest, method)`
  is an exact match.
- `assets(manifest)`; `publishedFiles(manifest)`: widget files plus assets as
  absolute paths under `manifest._dir` (empty without a dir).
- `rootId(extensionId, widgetId)` -> `ext:<extensionId>:<widgetId>`, the layout
  key an extension widget is placed under; `parseRootId(rootId)` ->
  `{ extensionId, widgetId }` or null; `isExtensionRootId(rootId)`.
- `widgetUrl(extensionId, file)` -> [ExtensionUrls](ExtensionUrls.md)`.uiFile`.

## Why

Live modules are keyed by artifact root id; extension widgets need a key of
their own that cannot collide with one (`ext:` prefix) and survives the
extension being disabled (the layout keeps the id; the page shows a tombstone).
The `api` list is the whole allow-list: a method not named here is never
callable from a renderer, however the activate() API is shaped. A widget's
`context` is a second, narrower grant: one method, called only by the host's
[DashboardSnapshot](../../dashboard/DashboardSnapshot.md), never by a page.

Read by [ExtensionAssetGate](../../../app/gateway/ExtensionAssetGate.md),
[ManifestValidator](ManifestValidator.md), [ExtensionApiCall](ExtensionApiCall.md)
and [ExtensionWidgetCatalog](../../dashboard/ExtensionWidgetCatalog.md).
