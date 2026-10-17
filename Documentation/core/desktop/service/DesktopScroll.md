# DesktopScroll

`core/desktop/service/DesktopScroll.js`

`desktop_scroll` with real input, after the window is resolved.

## Methods

- `new DesktopScroll(parts)` (`win`, `guards`, `input`, `frames`, `vision`, `bringToFront`, `sleep`).
- `scroll(w, { direction = 'down', amount = 3, x, y, description, zoom })` never
  throws. `guards.targetRefusal` first, so an anti-cheat game is refused before
  any vision call. The point: x/y of the last screenshot when there is one, else
  a `description` found by [VisionLocator](VisionLocator.md), else the window
  centre. For the desktop target (hwnd 0) the point travels with it so the window
  under it is vetted. Then `guards.preInput`, brings the window to the front, puts
  the cursor there and sends `amount` wheel notches (1 to `MAX_NOTCHES` 10, 120
  each, 20 ms apart): vertical for up/down, horizontal for left/right; up and
  right are positive. `{ direction, notches }`, plus `capped` (look, then scroll
  again) when more were asked, and `method: 'vision'` and `screen` after a description.

## Why

The cap was 30: a model asked for 30 and 40 notches blind and overshot the list
into the footer twice. Scrolling a screen or so, then looking, lands better.
