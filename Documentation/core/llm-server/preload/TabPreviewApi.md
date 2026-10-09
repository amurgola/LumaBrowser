# TabPreviewApi

`core/llm-server/preload/TabPreviewApi.js`

llmDiagAPI section `tabPreview`: the agent's work tab parked over a rect this page reserves in its tool card. Rect, focus and detach are fire-and-forget sends (the rect reporter runs on scroll); main honours them only from the tab hosting the current preview.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `tabPreview.rect(rect)` | send `tab-preview:rect` |
| `tabPreview.focus()` | send `tab-preview:focus` |
| `tabPreview.detach()` | send `tab-preview:detach` |
| `tabPreview.onFrame(cb)` | subscribe `tab-preview:frame` |
| `tabPreview.getEnabled()` | invoke `tab-preview:get-enabled` |
| `tabPreview.setEnabled(enabled)` | invoke `tab-preview:set-enabled` |
