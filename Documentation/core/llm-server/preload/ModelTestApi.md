# ModelTestApi

`core/llm-server/preload/ModelTestApi.js`

llmDiagAPI section: the fit test (a measured context by KV-precision sweep) and the compatibility gambit (a behavioural test of the loaded model), with the same run, cancel, status, results and event shape.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `runFitTest(modelPath)` | invoke `core.llmServer.runFitTest` |
| `cancelFitTest()` | invoke `core.llmServer.cancelFitTest` |
| `getFitResults()` | invoke `core.llmServer.getFitResults` |
| `getLocalModelOptions()` | invoke `core.llmServer.getLocalModelOptions` |
| `getFitTestStatus()` | invoke `core.llmServer.getFitTestStatus` |
| `onFitTestEvent(cb)` | subscribe `core.llmServer.fitTestEvent` |
| `runGambit(modelPath, filter, opts)` | invoke `core.llmServer.runGambit` |
| `cancelGambit()` | invoke `core.llmServer.cancelGambit` |
| `getGambitStatus()` | invoke `core.llmServer.getGambitStatus` |
| `getGambitResults()` | invoke `core.llmServer.getGambitResults` |
| `getGambitRaw()` | invoke `core.llmServer.getGambitRaw` |
| `onGambitEvent(cb)` | subscribe `core.llmServer.gambitEvent` |
