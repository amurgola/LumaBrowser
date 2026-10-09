# CodeSurfaceReporter

`core/llm-server/ui/js/chat/modes/CodeSurfaceReporter.js`

Tells the tab page whether the open conversation has a folder on disk (Code
mode's project, Game mode's game) so the mode pill shows "Code" and the editor
opens over that folder. A plain chat, the landing, a runs view and a mode without
a folder report unavailable; a late answer for a closed conversation is dropped.

## Methods

- `report()`: dispatches window `luma-code-surface` with
  `{ conversationId, available, root, label }` (probing
  `api.chat.workspace.info`).
