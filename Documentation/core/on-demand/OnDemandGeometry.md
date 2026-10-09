# OnDemandGeometry

`core/on-demand/OnDemandGeometry.js`

Pure math for where Luma On Demand's floating icon and opened Live panel sit
inside the page area, in window-content CSS pixels.

## Methods

- `OnDemandGeometry.defaultPosition(rect, iconSize?)` is the bottom-right resting
  spot, `MARGIN` px in from both edges, never negative.
- `OnDemandGeometry.clampPosition(pos, rect, iconSize?)` keeps the icon fully
  inside the rect, rounded. Non-finite input lands top-left; a rect smaller than
  the icon pins it top-left.
- `OnDemandGeometry.iconBounds(pos, rect, iconSize?)` is the collapsed icon's
  window-content bounds (rect offset applied).
- `OnDemandGeometry.panelBounds(pos, rect, { iconSize, width, height }?)` is the
  opened panel's bounds. It grows from the icon's corner rightward and downward
  when there is room, otherwise leftward and upward from the icon's far edge, and
  shrinks to fit a short page area (never below `MIN_PANEL_HEIGHT` unless the page
  itself is shorter). Always inside the rect.
- `OnDemandGeometry.rectUsable(rect)` is false for a missing or 0x0 rect (a shell
  modal collapses the page area).
- Statics: `ICON_SIZE` (56), `PANEL_WIDTH` (380), `PANEL_HEIGHT` (520),
  `MARGIN` (16), `MIN_PANEL_HEIGHT` (240).

## Why

Positions are stored relative to the page rect's top-left corner, so a resized
window or a toggled side panel keeps the icon where the user put it rather than
where it happened to land in window coordinates. Kept free of Electron so the
clamping rules are unit-testable; OnDemandOverlay feeds it the tab surface rect
(`TabViewManager.currentBounds`) and the saved icon position.
