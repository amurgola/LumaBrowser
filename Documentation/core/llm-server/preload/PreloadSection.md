# PreloadSection

`core/llm-server/preload/PreloadSection.js`

Base class of the `window.llmDiagAPI` sections merged by
[LlmTabPreloadApi](LlmTabPreloadApi.md).

## Methods

- `static build(ipcRenderer, webUtils)`: returns the section's members (each a
  function or a plain object of functions). The base throws
  `<Section>.build is not implemented`.
- `static subscribe(ipcRenderer, channel, map?)`: a subscribe function from
  [IpcSubscription](../../shared/ipc/IpcSubscription.md)`.of`.

Every member keeps legacy's exact argument forwarding (`x || {}`, `x || null`,
fixed parameter lists), so a call passes main exactly what legacy did.
