# DesktopScroll

`core/desktop/service/DesktopScroll.js`

`desktop_scroll` with real input, after the window is resolved.

## Methods

- `new DesktopScroll(parts)`.
- `scroll(w, { direction = 'down', amount = 3, x, y })` never throws. After
  `guards.preInput`, puts the cursor over the window centre (or x/y of the last
  screenshot when there is one), brings the window to the front, and sends
  `amount` wheel notches (1-30, 120 each, 20 ms apart): vertical for up/down,
  horizontal for left/right; up and right are positive. `{ direction, notches }`.
