# Sidebar

`core/llm-server/ui/js/chat/sidebar/Sidebar.js`

The sidebar's shell: the header strip (search, collapse), New chat with its
mode-tray chevron, the extension mode launcher slot, the search box, the
reactive chats list and the artifacts pane, and the footer (Settings tray with
Advanced / Setup and General, All artifacts, Dashboard, logo). Buttons are
wired by `data-act`.

## Methods

- `build()`: registers the row templates ([ConversationList](ConversationList.md)),
  writes the markup, renders the [SidebarModes](SidebarModes.md), wires the
  search box (its `res-oninput` resolves the `cmSearch` handler on the chat's
  Resonant; Escape closes search), the artifacts pane's delegated clicks, every
  `data-act` button, the `cm` namespace, and Ctrl/Cmd+K (only while the sidebar
  is on screen, so the Setup view keeps its keystrokes).
- `applyExpanded()`, `toggle()` (persists through `api.setSidebarCollapsed`),
  `expand()` (search, artifact views and the Settings tray need room).
- `toggleSearch()`: leaving either artifacts view first; closing clears the term
  and restores the full list.
- `applySettingsMenu(open)`.
- `Sidebar.iconButton(icon, act, label, cls?)`: the labelled icon button markup.

The web shim has no `openAppSettings` or `openDashboard`: the footer then shows
the plain Advanced / Setup button and no Dashboard.
