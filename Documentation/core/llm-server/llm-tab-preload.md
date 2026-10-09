# llm-tab-preload

`core/llm-server/llm-tab-preload.js`

The preload entry of the pinned LLM tab. It only calls
[LlmTabPreloadApi](preload/LlmTabPreloadApi.md)`.expose(contextBridge, ipcRenderer, webUtils)`,
which exposes `window.llmDiagAPI`. [PinnedLlmTab](service/PinnedLlmTab.md)
passes this path as the tab's `preloadPath`.

## Why it is split

The LLM tab is a tab view, and TabViewFactory creates tab views with
`sandbox: false`, `contextIsolation: true`, `nodeIntegration: false`. An
unsandboxed preload may require local files, so the surface is one class per
section under `preload/` (the renderer-phase rule) instead of legacy's single
file. Only this tab loads this preload; other tabs get `webview-preload.js`, so
an arbitrary page can never reach these channels.

## Packaging

The entry, every file in `core/llm-server/preload/` and
`core/shared/ipc/IpcSubscription.js` / `VoiceChannels.js` must ship as plain JS
(bytecode SKIP_FILES and asarUnpack).
