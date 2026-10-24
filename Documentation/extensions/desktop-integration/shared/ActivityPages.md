# ActivityPages

`extensions/desktop-integration/shared/ActivityPages.js`

The two self-contained pages of [ActivityOverlay](ActivityOverlay.md), loaded
as data URLs with Luma's design tokens inlined (`tokens.css`), so they follow
the app's palette (navy surfaces, the `--accent` ember) and type (Segoe UI
Variable).

## Pages

- `ringHtml(tokensCss)`: the edge light (an inset glow masked to thin out from
  the top down), a halo and a bright band at the top center where the island
  sits. `window.__ring.render({ on, mode, framed, lock })`, `mode` one of
  `live`, `paused`, `busy`, `armed` or empty. Armed layers: the ignition (a
  conic mask on the registered `--a` angle, revealing from the top center both
  ways, with a hot head), a crisp comet line and its soft bloom (a rotating
  conic gradient inside an edge-band mask; only `transform` and `opacity` run
  continuously, so the loop stays on the compositor). `framed` insets the light
  by `RING_PAD` (18 px) with rounded corners and an outer glow; a changed
  `lock` while armed replays the ignition.
- `islandHtml(tokensCss)`: the pill. Mark per kind (`speech`: four animated
  bars, flat while paused; `busy`: a spinner; `done`: a check; `error`: a
  warning glyph in `--warning`), title, detail (ellipsized), icon buttons with
  tooltips, and a 2px progress line. Kind `keys` (the shortcut hint) shows
  `hint` (the held modifiers, muted) and one chip per `keys` entry `{ id, key,
  label, disabled, note }`: a keycap and its label; hover lights the keycap in
  the accent and shows `note` in the caption under the pill (`state.caption`
  otherwise); a click emits the entry's id; disabled chips are dimmed, still
  show their note, and ignore clicks. The keys pill opens with a spring, its
  chips arrive one after another, and a light runs round its rim. `window.__island.render(state)` paints
  and returns the size the window needs; `window.__island.next()` resolves with
  the id of the next clicked action; `window.__island.release()` resolves
  pending waits with null. The pill opens from a dot (a `clip-path` reveal) and
  closes the same way.
- `RING_PAD`, `dataUrl(html)`, `ICONS` (inline 16px SVGs: pause, play, stop, open, close).
