# AiActivityPanel

`ui/shell/activity/AiActivityPanel.js`

The AI Activity toolbar count and panel: LLM queue work plus background agent runs, renders coalesced per frame, timers tick only while open.

## Methods

- `install()`, `render()`.

## Globals

Reads `window.llmQueueAPI`, `window.ipcBridge.on('core.dashboard.tasks.event')`.
