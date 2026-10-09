# FileDrop

`core/llm-server/ui/js/chat/main/FileDrop.js`

Drag-and-drop attach: files dropped anywhere on the chat are read through
`api.readDroppedAttachments` and staged like picked ones, with a "Drop to
attach" veil while dragging. A surface with its own drop handling wins by
calling `preventDefault` first; every other file drop is swallowed so Chromium
never navigates the tab to the file.

## Methods

- `install()`: only when the API reads dropped files (desktop).
- `FileDrop.hasFiles(event)`.
