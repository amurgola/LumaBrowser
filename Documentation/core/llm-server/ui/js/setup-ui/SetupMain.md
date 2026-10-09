# SetupMain

`core/llm-server/ui/js/setup-ui/SetupMain.js`

Builds and starts the LLM tab's Setup main panel: the Defaults, launch plan,
Runtimes and Models cards, the Server Info diagnostics, the
[Advanced view](advanced/AdvancedView.md), [extension Setup tabs](extensions/SetupExtensionTabs.md)
and [sub-view navigation](nav/SetupNavigator.md), with their live event wiring.
The page entry constructs it with the preload API and the collaborators other
modules own.

## Methods

- `new SetupMain({ api, doc?, win?, modelList?, modelSearch?, openers? })`.
- `start()`: wires every listener (nav clicks, the Advanced sub-tabs, extension
  tabs, the body click router, live events, fit-test and gambit events, the
  Refresh button) and resolves after the first `load()`.
- `load({ force }?)`: the [DiagnosticsLoader](diagnostics/DiagnosticsLoader.md)
  pass. Only Refresh forces a host re-probe.
- Public fields for the page entry: `navigator` ([SetupNavigator](nav/SetupNavigator.md)),
  `advanced` ([AdvancedView](advanced/AdvancedView.md)), `extensionTabs`
  ([SetupExtensionTabs](extensions/SetupExtensionTabs.md)), `ctx` ([SetupContext](SetupContext.md)).

## Wiring for the page entry (wave 3)

```js
import SetupMain from './setup-ui/SetupMain.js';
import PreflightBanner from './setup-ui/preflight/PreflightBanner.js';

const setup = new SetupMain({ api: window.llmDiagAPI, modelList, modelSearch,
  openers: { image: () => imageSetup.open(), music: () => musicSetup.open() } });
setup.start();
new PreflightBanner({ api: window.llmDiagAPI }).start();
```

Call it after `FoldMemory.install(document)` and `SegmentedPicker.install(document)`
(the Defaults card renders segmented pickers and remembered folds).

`setup.navigator` replaces legacy `window.LumaSetupNav` (`go(view)`,
`flushPending()`, `current()`). Legacy readers were `mode-toggle.js` (deep links
`#setup/<view>` and the showSetup `{ page }` payload) and `chat-mode.js` (the
"open LLM setup" path); pass the navigator to their ports.

## Collaborators

Owned by agent B2 (image-setup, music-setup, model-list, model-search). This
class takes them injected and never imports their files.

| Collaborator | Interface used | Legacy global |
|---|---|---|
| `modelList` | `mount(mountEl, namespace, { onAction? })` returning a controller with `set(rows, { preserveExpanded? })`, `patchRow(key, patch)`, `patchAll(fn(row) -> patch or null)`. Rows follow the `mlRow` contract ([ResonantTemplates](../resonant/ResonantTemplates.md)). Namespaces used: `'mlLlmRows'`, `'mlLlmAddon'` (with `onAction(row, act, event, button)` for `data-ml-act` buttons). | `window.LumaModelList` |
| `modelSearch` | `open()` (the `[data-open-model-search]` button) | `window.LumaModelSearch` |
| `openers.image` | `()`: lazy init when the Image view is shown | `window.__lumaImageSetupOpen` |
| `openers.music` | `()`: lazy init when the Music view is shown | `window.__lumaMusicSetupOpen` |

Contract the other way: the body click router toggles `.collapsed` on any
`.runtime-row` whose `.runtime-head` is clicked, including the Image and Music
runtime rows, which rely on it (legacy image-setup.js says so). The model-search
modal fires `window` event `luma-models-changed` after a download; this class
refreshes the library on it.

## Events

Listens to `window` `luma-models-changed`, and through the preload
`onRuntimeEvent` (row progress; `finalize` refreshes the library with runtimes),
`onModelEvent` (`done` refreshes the library), `onServerEvent`, `onAddonEvent`,
`onFitTestEvent`, `onGambitEvent`.

## Globals

Reads `window.llmDiagAPI` only through the injected `api`; listens on `window`
and `document.body`. Writes none itself; [SetupExtensionTabs](extensions/SetupExtensionTabs.md)
writes `window.LumaSetupExt`.
