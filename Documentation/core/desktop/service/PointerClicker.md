# PointerClicker

`core/desktop/service/PointerClicker.js`

A real mouse click at a screen point.

## Methods

- `new PointerClicker({ win, guards, input, bringToFront, uia, sleep })`;
  `bringToFront` and `uia` are DesktopService's, so overrides of either apply.
- `click(w, sx, sy, { button = 'left', double = false, ref, refRect })` in order:
  `guards.preInput(w)`, bring the window to the front (else throws `Could not bring
  "<title>" to the front to click it.`), UIA hit test at the point (after the
  focus change, so it sees what the click will hit), and for a ref click a
  `COVERED` refusal via [HitCover](HitCover.md) before any mouse input. Then it
  saves the cursor, moves it, sends down/up (twice with 60 ms between for a double
  click) through [GuardedInput](GuardedInput.md), and restores the cursor. A
  button down when the foreground was stolen is always released. Resolves
  `{ name, role, rect }` of what was under the point, or null.

A hit test that fails or is unavailable never blocks a click; x/y clicks report
the hit but are never refused by it.
