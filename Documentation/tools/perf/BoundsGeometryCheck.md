# BoundsGeometryCheck

`tools/perf/BoundsGeometryCheck.js`

Judges the native-view bounds the shell sent during the geometry probe: the settings modal and a dynamic
`.lm-overlay` collapse the view to width 0, closing them restores it, a right-hand side panel shrinks it, growing
the panel by 100 px shrinks it by exactly 100 px, and hiding the panel's ancestor restores it.

## Methods

- `BoundsGeometryCheck.problem(g)` -> the failure message or null.
- `BoundsGeometryCheck.verify(g)` -> `g`, or throws the failure message.
- Constants: `MODAL_FAILURE`, `PANEL_FAILURE`, `PANEL_GROWTH`.
