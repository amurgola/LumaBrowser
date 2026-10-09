# WidgetDock

`core/dashboard/ui/js/WidgetDock.js`

The dock rail: one row per live module and, under a "From extensions" heading
(`.db-dock-section`), one per extension widget; the hidden-list toggle and
placed marking.

## Methods

- `new WidgetDock({ doc, catalog, grid, onAdd })`.
- `render()`: full re-render (GridStack binds drag-in per element, so a placed
  chain's row must be rebuilt): live rows, then the extensions heading and
  rows (`.db-dock-ext`, `gs-w`/`gs-h` from the manifest size), the empty note
  ("No widgets yet..." or "Every widget is hidden..."), the toggle ("Show
  hidden (n)" / "Hide hidden widgets (n)", hidden when none), then
  `syncPlaced` and `grid.armDragIn()`.
- `syncPlaced()`: `db-placed`, "On board" (wins over "Hidden"), the Add button
  hidden, title "Already on the dashboard".
- `toggleShowHidden()`.

Rows carry `data-root-id`, `gs-w`/`gs-h`, an escaped title, Add (not on hidden
rows; the keyboard alternative to drag-in) and Hide/Show.
