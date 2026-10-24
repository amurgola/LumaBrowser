# AttachPlacement

`extensions/desktop-integration/features/lumabyte/AttachPlacement.js`

Pure geometry, in DIP.

- `dock(frame)`: the 36 px button `DOCK_INSET` (10) inside the window's
  bottom-left corner, plus a `DOCK_MARGIN` (10) transparent margin for its glow.
- `panel(frame, area)` -> `{ x, y, width, height, side }`: `PANEL_W` (384) wide,
  the window's height within `PANEL_MIN_H` (380) to `PANEL_MAX_H` (680) and the
  work area, bottom-aligned with the window. Left of the window when there is
  room (the dock's side), else right, else `inside` (a maximized window): rising
  from just above the dock.
- The panel window includes a `PANEL_MARGIN` (12) transparent margin where its
  soft shadow renders; `GAP` (8) is measured between what shows.
