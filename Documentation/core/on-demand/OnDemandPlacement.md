# OnDemandPlacement

`core/on-demand/OnDemandPlacement.js`

Pure bounds maths for the On Demand window, on top of
[OnDemandGeometry](OnDemandGeometry.md).

## Methods

- `OnDemandPlacement.pageRect(bounds)` normalises `TabViewManager.currentBounds`
  (missing fields are 0; a missing rect is all zeros).
- `OnDemandPlacement.innerBounds(pos, rect, expanded)` is the tile
  (`iconBounds`) or panel (`panelBounds`) rect; a missing `pos` uses the default corner.
- `OnDemandPlacement.windowBounds(inner, origin?)` is the owned window's screen
  bounds: the shell content-area origin plus the inner rect, grown by `PAD` on
  every side, rounded.
- `OnDemandPlacement.tileRect(inner)` copies `{ x, y, width, height }` or passes `null`.
- `OnDemandPlacement.isValidPosition(pos)` needs finite `x` and `y`.
- `OnDemandPlacement.emptyRect()`, `OnDemandPlacement.PAD` (12).

## Why

The window is `PAD` px larger than the tile or panel so the CSS drop shadow has
transparent room to render in. `PAD` must equal `--pad` in
`core/on-demand/ui/on-demand.css`.
