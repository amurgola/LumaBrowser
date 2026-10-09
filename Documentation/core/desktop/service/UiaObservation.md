# UiaObservation

`core/desktop/service/UiaObservation.js`

The UIA nodes of the last `desktop_observe`. Refs are meaningful for one window
at a time: the sidecar renumbers them on every tree read.

## Methods

- `record(hwnd, nodes)` remembers the nodes and makes `hwnd` the window refs belong to.
- `isFor(hwnd)` whether refs currently belong to that window.
- `node(hwnd, ref)` the observed node with that ref, or null.
- `UiaObservation.NOT_OBSERVED` `Refs come from desktop_observe of THIS window; observe it first.`
