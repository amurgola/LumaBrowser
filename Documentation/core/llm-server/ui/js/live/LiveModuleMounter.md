# LiveModuleMounter

`core/llm-server/ui/js/live/LiveModuleMounter.js`

The one mounter for live (interactive) artifacts in the chat, the web PWA and
the Dashboard, so the three cannot drift. The pop-out page has its own
equivalent in [LiveModuleDocument](../../../chat/artifacts/LiveModuleDocument.md);
keep the two aligned.

## Methods

- `LiveModuleMounter.mount(root, { html?, js?, libs?, store?, luma? })`
  1. Marks `root.dataset.mounted = '1'` (a second call on the same element does
     nothing) and injects `html`.
  2. If any lib name matches `/chart/i`, loads Chart.js with
     [ChartLoader](ChartLoader.md); if that fails it renders ONE error and does
     not run the module.
  3. Polyfills `root.getElementById` and makes a scoped Resonant
     (`ResonantRuntime.scoped(root)`, or `null` when ResonantJs is not loaded).
  4. Runs the model-authored `js` with parameters `(root, R, Chart, store,
     luma)`. A name the module declares itself (`const store = ...`) is not
     bound ([LiveModuleSource](LiveModuleSource.md)); a missing bridge is bound as
     `null` so `if (luma)` feature detection works. With a store or luma the
     body runs as an async IIFE (top-level `await store.get(...)` works);
     otherwise the legacy synchronous mount is kept.
  Errors render into `<pre class="cm-live-err">` escaped with
  `HtmlEscaper.escapeText` and never throw. Pass `store` as an
  [ArtifactDataStore](../artifacts/ArtifactDataStore.md) (or `null` when
  `LiveModuleSource.declaresOwnStore(js)`) and `luma` from
  [LumaBridge](LumaBridge.md).
- `LiveModuleMounter.polyfillElementFinders(el)` adds `getElementById(id)` (as
  `querySelector('#' + CSS.escape(id))`) to an element that lacks it.

Trust model: the same as html artifacts, which run model script in a tab.
Styling comes from `css/live-module.css` (`.cm-live-root`), which every
consuming page links.

## Globals

Reads `window.Resonant` (through ResonantRuntime), `window.CSS`.
