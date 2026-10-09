# ChatDock

`core/llm-server/ui/js/code/ChatDock.js`

The conversation docked beside the editor: the Chat button's preference
(`luma.code.chatDock`, docked unless '0') and the drag grip that sets
`--ce-chat-w` on `<body>` (`luma.code.chatDockWidth`, clamped to 320 px and
the window minus 480 px; double-click resets).

## Methods

- `wanted()`, `setWanted(on, button?)` (repaints, then dispatches `luma-code-dock`),
  `paintButton(button)`, `applyWidth(px)`, `clamp(width)`, `buildGrip(onResized)`.

## Globals

Writes `localStorage` keys above; dispatches the window event `luma-code-dock`.
