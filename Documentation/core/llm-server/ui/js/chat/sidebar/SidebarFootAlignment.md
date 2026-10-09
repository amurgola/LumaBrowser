# SidebarFootAlignment

`core/llm-server/ui/js/chat/sidebar/SidebarFootAlignment.js`

Keeps the sidebar footer and the composer bar the same height so their top
borders meet on one pixel row: the shorter one gets the difference as bottom
padding (`--cm-foot-slack` / `--cm-bar-slack`, consumed in chat.css).

## Methods

- `install()`: a ResizeObserver on both (skipped where there is none).
- `sync()`: clears both slacks while the composer bar is hidden (landing); while
  the Settings tray is out the composer keeps its slack instead of chasing it.
