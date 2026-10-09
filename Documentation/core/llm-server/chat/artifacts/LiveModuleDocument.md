# LiveModuleDocument

`core/llm-server/chat/artifacts/LiveModuleDocument.js`

The standalone page body for a live artifact (the "pop out to tab" view and the
sharing and `/share` links). It mounts the module the way the inline chat
renderer (`core/llm-server/ui/js/live-mount.js`) does: a scoped ResonantJS
instance, optional Chart.js, then the model's JS run with
`(root, R, Chart, store, luma)`.

## Methods

- `LiveModuleDocument.renderBody(row, opts, configuredBase)`: the body HTML.
  `row.content` is JSON `{ html, js, libs[] }`; malformed content renders an
  empty module.
- `LiveModuleDocument.BASE_CSS`: the house style scoped to `#cm-live-root`.

## Surface options

| option | effect |
|---|---|
| none | in-app pop-out: libs, data store and `luma` bridge on the gateway (`<base>/llm-ui/...`, `<base>/artifacts/data`, `<base>/artifacts/api`) |
| `webBase: ''` | same-origin relative paths (share routes serve `/llm-ui` themselves) |
| `webBase: 'http://...'` | pin a host (trailing slashes dropped) |
| `dataEndpoint` | where the `store` talks to |
| `dataReadOnly: true` | viewer surfaces whose store must reject writes |
| `apiEndpoint` | where `luma` talks to; `''` disables it |

Any `webBase` override disables the default `luma` endpoint: remote viewers
must never drive this machine's browser unless a caller opts in explicitly.
With no web base at all (the file:// fallback) there are no lib tags, no data
endpoint and no `luma`.

`libs` mentioning `chart` load Chart.js. If Chart was requested but did not
load, the page shows one clear error and does not run the module.

## Mount rules (parity with live-mount.js)

- `root.getElementById` is polyfilled to `querySelector('#id')`.
- Errors render into `<pre class="cm-live-err">` with `&`, `<`, `>` escaped.
- A module declaring its own `store` or `luma` keeps that name unbound;
  otherwise both are always bound (as `null` when absent) so the
  `if (luma) { ... }` feature check never throws.
- With a store or `luma` the body runs as an async IIFE (top-level `await`
  works); otherwise synchronously.
- The store binds to the chain's root id, so every version shares one state.

`BASE_CSS` must stay in sync with `.cm-live-root` in
`core/llm-server/ui/css/live-module.css`.
