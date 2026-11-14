# PlacementApi

`core/llm-server/preload/PlacementApi.js`

llmDiagAPI section `placement`: the Advanced tab's manual VRAM placement (layout, auto-arrange, measured fits, hotswap info, start and stop) and its timing test with events.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `placement.isAvailable()` | invoke `core.placement.isAvailable` |
| `placement.getConfig()` | invoke `core.placement.getConfig` |
| `placement.setConfig(patch)` | invoke `core.placement.setConfig` |
| `placement.autoArrange()` | invoke `core.placement.autoArrange` |
| `placement.getMeasured()` | invoke `core.placement.getMeasured` |
| `placement.getVramSnapshot()` | invoke `core.placement.getVramSnapshot` |
| `placement.getHotswapInfo()` | invoke `core.placement.getHotswapInfo` |
| `placement.previewRig(rigId)` | invoke `core.placement.previewRig` |
| `placement.start()` | invoke `core.placement.start` |
| `placement.stop()` | invoke `core.placement.stop` |
| `placement.reloadStale()` | invoke `core.placement.reloadStale` |
| `placement.runTest()` | invoke `core.placement.runTest` |
| `placement.onTestEvent(cb)` | subscribe `core.placement.testEvent` |
