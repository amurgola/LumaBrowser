# GroundingApi

`core/llm-server/preload/GroundingApi.js`

llmDiagAPI section `grounding`: the managed grounding server (the vision model that finds elements on screenshots) with its download events, and the desktop-control opt-in shown in the same card.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `grounding.getView()` | invoke `core.groundingServer.getView` |
| `grounding.setModel(sel)` | invoke `core.groundingServer.setModel` |
| `grounding.pickModel()` | invoke `core.groundingServer.pickModel` |
| `grounding.downloadRecommended(id)` | invoke `core.groundingServer.downloadRecommended` |
| `grounding.cancelDownload()` | invoke `core.groundingServer.cancelDownload` |
| `grounding.setAutoUnload(ms)` | invoke `core.groundingServer.setAutoUnload` |
| `grounding.start()` | invoke `core.groundingServer.start` |
| `grounding.stop()` | invoke `core.groundingServer.stop` |
| `grounding.onEvent(cb)` | subscribe `core.groundingServer.event` |
| `grounding.desktopState()` | invoke `core.desktop.getState` |
| `grounding.setDesktopEnabled(on)` | invoke `core.desktop.setEnabled` |
