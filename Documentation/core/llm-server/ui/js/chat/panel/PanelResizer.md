# PanelResizer

`core/llm-server/ui/js/chat/panel/PanelResizer.js`

The artifact panel's width and theater mode. A `.cm-ap-resize` separator on the
panel's left edge drags its width (pointer capture; the body gets
`cm-ap-resizing` so frames do not swallow the moves), Left / Right step it by
24 px when focused, and a double click restores the stylesheet default. The
width is clamped so the panel keeps 320 px and the chat column 320 px, and
persists in `localStorage` (`luma.chat.panelWidth`). Theater puts
`cm-panel-theater` on the chat root: the chat column hides and the panel takes
the stage.

## Methods

- `install()`, `restore()`, `reset()`, `clamp(width)`.
- `isTheater()`, `setTheater(on)`, `toggleTheater()`.

`onResize()` runs at most once a frame while the width moves (the panel
relayouts the viewer or the editor).
