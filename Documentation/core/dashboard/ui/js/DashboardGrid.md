# DashboardGrid

`core/dashboard/ui/js/DashboardGrid.js`

The GridStack 12-column grid: one card per chain, removal, static (Live) versus
editable (Edit), the persisted geometry and dock drag-in.

## Methods

- `new DashboardGrid(GridStack)`, `init()` (GridStack.init with `OPTIONS`:
  float, 12 columns, 6rem cells, margin 5, visible resize handles, animate,
  accepts `.db-dock-item`, drag by `.db-card-head`).
- `on(event, handler)`, `isReady()`, `isPlaced(rootId)`, `placedIds()`, `isEmpty()`.
- `add(rootId, card, pos)`: wraps the card in a `.grid-stack-item` and calls
  `makeWidget` with `id: rootId` (GridStack 12 does not read `gs-id`; without
  the id the saved layout, placed detection and removal break). No `x` means
  `autoPosition`; size defaults to `DEFAULT_W` 4 x `DEFAULT_H` 3.
- `removeCard(cardEl)` (fires `removed`), `discardDropped(el)` (no event).
- `setStatic(isStatic)`, `layoutItems()` (`[{ rootId, x, y, w, h }]`, nodes
  without an id skipped; null before init), `armDragIn()` (rows matching
  `DOCK_DRAG_SELECTOR`, cloned helper appended to body).
