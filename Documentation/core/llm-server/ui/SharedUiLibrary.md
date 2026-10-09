# Shared renderer UI library

`core/llm-server/ui/js/`, `core/llm-server/ui/resonant.js`, `core/shell/ui/luma-modal.js`,
`extensions/ui-kit/ui/`, `extensions/ext-ui.js`

The renderer helpers several pages share: formatting and escaping, the chat
markdown renderer, ResonantJs access, live-artifact mounting and data, Monaco
loading, the setup pipelines, themed dialogs and the extension UI kit. Every
class is a native ES module (`export default class`), one class per file, with
relative `.js` imports. Start here, then open the class doc.

## Folders

| Folder | Classes | Was |
|---|---|---|
| `js/format/` | [HtmlEscaper](js/format/HtmlEscaper.md), [ByteFormatter](js/format/ByteFormatter.md), [TransferText](js/format/TransferText.md) | `format.js`, parts of `shared.js` and `setup-engine.js` |
| `js/dom/` | [Dom](js/dom/Dom.md), [Clipboard](js/dom/Clipboard.md) | `format.js` `el`, `shared.js` `$` and `copyText` |
| `js/dialogs/` | [Dialogs](js/dialogs/Dialogs.md) | `window.LumaModal` calls with native fallback |
| `js/markdown/` | [MarkdownRenderer](js/markdown/MarkdownRenderer.md), [MarkdownBlocks](js/markdown/MarkdownBlocks.md), [MarkdownInline](js/markdown/MarkdownInline.md), [CodeHighlighter](js/markdown/CodeHighlighter.md), [AttachmentParser](js/markdown/AttachmentParser.md) | `markdown.js` |
| `js/resonant/` | [ResonantRuntime](js/resonant/ResonantRuntime.md), [ResonantTemplates](js/resonant/ResonantTemplates.md) | page inline script, `resonant-templates.js` |
| `js/artifacts/` | [ArtifactDataStore](js/artifacts/ArtifactDataStore.md), [ArtifactDataTransport](js/artifacts/ArtifactDataTransport.md), [IpcDataTransport](js/artifacts/IpcDataTransport.md), [HttpDataTransport](js/artifacts/HttpDataTransport.md), [ArtifactDataCache](js/artifacts/ArtifactDataCache.md) | `artifact-data-client.js` |
| `js/live/` | [LiveModuleMounter](js/live/LiveModuleMounter.md), [ChartLoader](js/live/ChartLoader.md), [LiveModuleSource](js/live/LiveModuleSource.md), [LumaBridge](js/live/LumaBridge.md) | `live-mount.js` |
| `js/monaco/` | [MonacoLoader](js/monaco/MonacoLoader.md), [MonacoThemes](js/monaco/MonacoThemes.md), [MonacoDiagnostics](js/monaco/MonacoDiagnostics.md), [MonacoLanguages](js/monaco/MonacoLanguages.md) | `monaco-loader.js` |
| `js/setup/` | see [SetupPipeline](js/setup/SetupPipeline.md) and the setup docs | `setup-engine.js`, parts of `shared.js` |
| `extensions/ui-kit/ui/` | [ExtIcons](../../../extensions/ui-kit/ui/ExtIcons.md), [SavedBadge](../../../extensions/ui-kit/ui/SavedBadge.md), [Debounce](../../../extensions/ui-kit/ui/Debounce.md), [OverflowMenu](../../../extensions/ui-kit/ui/OverflowMenu.md), [IntervalPicker](../../../extensions/ui-kit/ui/IntervalPicker.md), [TimeText](../../../extensions/ui-kit/ui/TimeText.md) | `extensions/ext-ui.js` |

`extensions/ui-kit/` is a plain folder, not an extension (no `manifest.js`, so
the extension scanner skips it). It holds the module form of the extension UI
kit so bundled extension renderers can import it.

## Classic-script exceptions

Four files stay classic scripts. Each is a contract other code reads as a global,
synchronously, from places that cannot import a module.

| File | Global | Why it stays classic |
|---|---|---|
| [resonant.js](resonant.md) | `window.Resonant`, `window.ObservableArray` | The owner's framework, copied unchanged as a vendor file. The pop-out live page (LiveModuleDocument) loads it as a classic script. |
| [luma-modal.js](../../shell/ui/luma-modal.md) | `window.LumaModal`, overrides `window.alert/confirm/prompt` | Served alone at `/llm-ui/luma-modal.js` by the gateway and the web backend, loaded by the extension editor, and read as a global by extension and add-on scripts. |
| [artifact-data-client.js](js/artifact-data-client.md) | `window.LumaArtifactData` | LiveModuleDocument's inline bootstrap reads it synchronously. A change request asks to move that page to a module; then this file can go. |
| [ext-ui.js](../../../extensions/ext-ui.md) | `window.LumaExtUI` | Classic add-on renderers inject `extensions/ext-ui.js` with a plain script tag and read the global in `onload`. |

`artifact-data-client.js` and `ext-ui.js` duplicate module classes on purpose;
a parity test runs one behaviour table against both copies, so a drift fails.

## How a page loads this library

1. Classic scripts first, in the page HTML, before the module entry (classic
   scripts without `defer` run before any module script):
   `<script src="/llm-ui/luma-modal.js"></script>`, then
   `<script src="/llm-ui/resonant.js"></script>` where ResonantJs is used.
2. One `<script type="module" src=".../entry.js">`. The entry imports classes
   and does what legacy load-time side effects did:
   - `ResonantTemplates.registerAll(ResonantRuntime.shared())` (was the
     `resonant-templates.js` load plus the inline `new Resonant()`).
   - `FoldMemory.install(document)` and `SegmentedPicker.install(document)` on
     every page that renders Setup cards (was the `shared.js` load).

## Served URLs and imports across mounts

The gateway serves `core/llm-server/ui/` at `/llm-ui/` (catch-all, falling back
to `llm-tab.html`), `core/dashboard/ui/` at `/dashboard-ui/`, and the single file
`core/shell/ui/luma-modal.js` at `/llm-ui/luma-modal.js`; the web backend serves
the same `/llm-ui/` tree (see app/gateway/StaticUiRoutes and
core/network-sharing/webapp/WebAppServer). The shell window and On Demand load
from `file://`, where file paths and URLs agree.

So an import works in both Jest and the browser only when the relative file
path and the relative URL resolve to the same file:

- Within `core/llm-server/ui/` (the LLM tab, extension chat bundles excepted):
  always fine.
- From `file://` pages (`index.html` modules under `ui/shell/`, On Demand):
  always fine, including `extensions/ui-kit/ui/`.
- From `/dashboard-ui/` or the PWA (`/`): a relative import of
  `../../llm-server/ui/js/X.js` resolves to the URL `/llm-server/ui/js/X.js`,
  which is not served. Those pages need an import map entry
  `{ "imports": { "/llm-server/ui/": "/llm-ui/" } }` (import maps also remap
  resolved relative URLs), or the page owner adds a route. This is for the
  dashboard and PWA porters to decide.
- Extension chat and setup bundles are served from `/llm-ui/ext/<id>/...`; the
  same mismatch applies (see the change requests in the wave report).

## Globals

Read: `window.LumaModal`, `window.Resonant`, `window.Chart`, `window.monaco`,
`window.require`/`window.define` (Monaco's AMD loader), `window.localStorage`,
`navigator.clipboard`, `window.CSS`. Written: only by the classic exceptions
above, plus `window.define` is hidden and restored around the Chart.js load.
Vendor globals (`window.Chart`, `window.monaco`, AMD `require`/`define`) are set
by the vendor bundles themselves.
