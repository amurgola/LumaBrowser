# DashboardPage

`core/dashboard/ui/js/DashboardPage.js` (started by `core/dashboard/ui/js/entry.js` on DOMContentLoaded)

The Dashboard tab page: builds the parts, wires the grid, controls and tab
lifecycle, then restores the saved arrangement.

## Methods

- `new DashboardPage(win, doc)`; `start()`:
  1. Environment check, else [FatalNotice](FatalNotice.md): no `dashboardAPI`
     ("This page must run inside LumaBrowser's Dashboard tab."), `file:` protocol
     ("...Enable the REST API in Settings..."), no `GridStack` ("Dashboard assets
     failed to load...").
  2. Builds the catalog, grid, saver, tasks, cards, mounts, dock and mode.
  3. Grid events: `dropped` swaps the drag clone for a real card at the drop
     position; `change` schedules a save; `added` syncs the empty hint;
     `removed` disposes mounts, re-marks the dock and saves.
  4. Controls: the Live/Edit pill, dock Refresh, the hidden-list toggle.
  5. Lifecycle: hiding the tab or `pagehide` flushes the save; showing it
     remounts stale widgets.
  6. `onPinned` (pin from chat): re-list, then place at the host's position.
  7. Restores the layout (unknown chains become tombstones), sets Live mode, or
     Edit when the layout is empty, and wires task events and badges.
- `addWidget(rootId, pos)`: one card per entry (live or extension, the card
  kind from the catalog); an extension widget placed without a size takes its
  manifest's `w`/`h`; mounts it, re-renders the dock, syncs the empty hint and
  refreshes badges. An entry the catalog no longer lists (deleted artifact,
  disabled extension) becomes a tombstone.
- `refreshDock()`: re-lists the catalog and renders the dock.

## Globals

Reads `win.dashboardAPI`, `win.GridStack`, `win.location`; listens on
`document` (visibilitychange) and `win` (pagehide).
