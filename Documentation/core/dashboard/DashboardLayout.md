# DashboardLayout

`core/dashboard/DashboardLayout.js`

The Dashboard grid's saved geometry and the widget dock's hidden list, both
kept in the settings database. Used through [DashboardService](DashboardService.md).

## Methods

- `new DashboardLayout(settingsDb)` any `get(key, default)` / `set(key, value)` store.
- `get()` `[{ rootId, x, y, w, h }]` from `core.dashboard.layout`; a non-array reads as `[]`.
- `set(items)` drops items without a string `rootId`, clamps the rest onto the
  12-column grid (x 0..11 default 0, y 0..9999 default 0, w 1..12 default 4,
  h 1..99 default 3), saves and returns them.
- `pin(rootId)` adds a chain at x 0, below the current bottom row, size 4x3.
  Returns `{ added: true, item, layout }`, or `{ added: false, layout }` for an
  empty id or a chain already placed.
- `hiddenWidgets()` root ids hidden from the dock (`core.dashboard.hiddenWidgets`),
  non-string and empty entries dropped.
- `setHidden(rootId, hidden)` adds or removes one id and returns the new list;
  an empty id changes nothing.
- Statics: `LAYOUT_KEY`, `HIDDEN_KEY`, `GRID_COLUMNS`, `NEW_ITEM`.

## Why geometry only

Widget content is re-derived from the artifact chain's latest version when the
widget mounts, so saving content would only go stale. New pins go below
everything so they never displace a widget the user arranged. Hiding affects
only the dock list; a hidden chain already on the grid keeps rendering.
