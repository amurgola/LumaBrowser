# SidebarModes

`core/llm-server/ui/js/chat/sidebar/SidebarModes.js`

The sidebar's extension chat-mode launcher: landing modes (Code, Game,
Roleplay...) in a tray under New chat that unfolds only on demand (open, the lit
row and the sunken tray panel form one rounded block, so the modes read as its
contents and not as more top-level rows), then the
always-visible utility rows (`launcher: 'sidebar'`, such as Chat with agent).
Hidden modes (system-owned conversations) are never offered.

## Methods

- `list(where)`: `'landing'` or `'sidebar'` modes from `chatExt.list()`.
- `render()`: no-op until the registry loaded; clicking a row starts that mode
  ([ModeLauncher](../modes/ModeLauncher.md)).
- `applyActive()`: highlights the active conversation's mode, folds the tray
  once anything is open, mirrors the open state on the chevron and New-chat row.
- `SidebarModes.rowHtml(mode, extraCls)`: name only; an `icon` counts only when
  it is real SVG markup, else the label's initial shows in the collapsed rail.
