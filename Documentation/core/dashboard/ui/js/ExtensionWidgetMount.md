# ExtensionWidgetMount

`core/dashboard/ui/js/ExtensionWidgetMount.js`

Mounts one extension-contributed widget: imports its ES module from the
gateway and calls its default export's `mount(root, host)`.

## Widget module contract

```js
export default {
  // root: the card's .cm-live-root element; host: see ExtensionWidgetHost.
  // May return a dispose function (sync or async) called when the card is removed or reloaded.
  async mount(root, host) { ...; return () => { /* teardown */ }; },
};
```

## Methods (static)

- `mount(root, meta, api)` -> `{ dispose }`. `meta` is the catalog's extension
  entry (`{ url, extensionId, ... }`), `api` is `window.dashboardAPI`.
  Idempotent per element (`root.dataset.mounted = '1'`). Imports `meta.url`
  through `ExtensionWidgetMount.importer` (a replaceable seam; jsdom cannot
  import a URL), builds the host with
  [ExtensionWidgetHost](ExtensionWidgetHost.md) and awaits `mount`. A module
  without a `default.mount` function (`NO_MOUNT`), a failed import or a
  throwing mount renders `<pre class="cm-live-err">` escaped with
  `HtmlEscaper.escapeText` and resolves a no-op dispose; nothing throws.
- `dispose` runs the widget's teardown once, swallowing a throw or rejection.

Styling: widgets render inside the same `.cm-live-root` card as live modules,
so `/llm-ui/css/live-module.css` and its `.lm-*` utilities apply.

Trust model: the module is first-party code from an enabled extension's
folder, served only when declared ([ExtensionAssetGate](../../../../app/gateway/ExtensionAssetGate.md)).
