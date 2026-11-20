# ModelTestApi

`core/llm-server/preload/ModelTestApi.js`

llmDiagAPI section: the fit test (a measured context by KV-precision sweep) with its run, cancel, status, results and events, and the chat model picker's context options built from those results.

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
