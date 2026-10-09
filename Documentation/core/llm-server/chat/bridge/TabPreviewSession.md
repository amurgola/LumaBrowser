# TabPreviewSession

`core/llm-server/chat/bridge/TabPreviewSession.js`

One turn's live tab preview: the agent's work tab parked inside its tool card,
frozen to a still frame when the tab goes away.

## Methods

- `TabPreviewSession.forRouter(router, hooks)`: manager from
  `BridgeGlobals.tabPreview()`, host tab from
  `router.llmServerService.pinnedTabId`.
- `new TabPreviewSession({ preview, hostTabId, hooks })`.
- `start(tabId)`: attaches once per turn (`preview.attach({ tabId, hostTabId })`
  must return `{ success: true }`) and emits `{ phase: 'tab', tabId }`. Inert
  without a manager, a host tab, a tab id, or when `preview.isEnabled()` is false.
- `end()`: captures the frame, then detaches, then emits
  `{ phase: 'tab-end', tabId, frame }` (frame null when capture failed). No-op
  when nothing is attached.
- `tabId()`: the attached tab or null.

Never throws: attach, capture, detach and renderer hook errors are swallowed.

## Why

Capture needs a live, parked view, so it runs before detaching and before the
tab is closed. Surfaces without a pinned chat tab (web PWA, scheduled runs)
quietly get no preview.
