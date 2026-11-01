# ActivityPages

`extensions/desktop-integration/shared/ActivityPages.js`

The two self-contained pages of [ActivityOverlay](ActivityOverlay.md), loaded
as data URLs with Luma's design tokens inlined (`tokens.css`), so they follow
the app's palette (navy surfaces, the `--accent` ember) and type (Segoe UI
Variable).

## Pages

- `ringHtml(tokensCss)`: the edge light (an inset glow and line all round, a
  brighter crown and side fades so the top is brightest and the bottom barely
  there), a halo and a bright band at the top center where the island sits.
  `window.__ring.render({ on, mode, framed, lock })`, `mode` one of `live`,
  `paused`, `busy`, `armed` or empty. The moving parts live in four edge
  strips (`_strip(side)`: top, right, bottom, left, each laid out along its own
  x axis clockwise and turned into place), clipped by `overflow: hidden` and
  never by a mask: the ignition (bodies revealed by a `scaleX` from the end the
  sweep enters, A clockwise and B counter-clockwise from the top center, a hot
  flare just behind each head, meeting at the bottom center), and two comets
  (a crisp line and a blurred bloom, half a lap apart) translated along each
  strip. The page's script writes the `@keyframes` for the box's size into
  `#dyn` on render and resize, so the sweep and the comets keep one speed
  whatever the edges' lengths; only `transform` and `opacity` animate, so the
  loop stays on the compositor. `framed` insets the light by `RING_PAD` (18 px)
  with rounded corners and an outer glow; a changed `lock` while armed replays
  the ignition.
  Why no masks: the earlier ring hid full-screen fills (a solid ignition fill,
  a 300vmax conic gradient) behind CSS masks; under the real app's GPU load the
  mask layer could land a frame late and the whole screen flashed orange
  (2026-10-30). Edge-shaped content inside a clip cannot flood the screen.
- `islandHtml(tokensCss)`: the pill. Mark per kind (`speech`: four animated
  bars, flat while paused; `busy`: a spinner; `done`: a check; `error`: a
  warning glyph in `--warning`), title, detail (ellipsized), icon buttons with
  tooltips, and a 2px progress line. Kind `keys` (the shortcut hint) shows
  `hint` (the held modifiers, muted) and one chip per `keys` entry `{ id, key,
  label, disabled, note }`: a keycap and its label (a chip without a `key`, an
  island choice with no shortcut, shows its label alone); hover lights the keycap in
  the accent and shows `note` in the caption under the pill (`state.caption`
  otherwise); a click emits the entry's id; disabled chips are dimmed, still
  show their note, and ignore clicks. The keys pill opens with a spring, its
  chips arrive one after another, and a light runs round its rim. `window.__island.render(state)` paints
  and returns the size the window needs; `window.__island.next()` resolves with
  the id of the next clicked action; `window.__island.release()` resolves
  pending waits with null. The pill opens from a dot (a `clip-path` reveal) and
  closes the same way.
- `RING_PAD`, `dataUrl(html)`, `ICONS` (inline 16px SVGs: pause, play, stop, open, close).
