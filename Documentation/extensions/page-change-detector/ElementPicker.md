# ElementPicker

`extensions/page-change-detector/ElementPicker.js`

Runs the in-page element picker (`picker.js`) for a monitor.

## Methods

- `new ElementPicker({ browser, tabs })`.
- `pick(monitor)`: opens (or reuses) a visible tab on the monitor's URL, waits
  up to 5 s for it to load, sets `window.__pcdInitialSelectors` to the current
  selectors, brings the tab to the front and runs the picker. Resolves the
  picked selector array or `null` when cancelled; throws when the script fails
  (`Element picker failed to run` or the browser's error) or returns a
  non-array.
- `ElementPicker.initialSelectorsScript(selectors)`, `ElementPicker.script()`
  (picker.js, read once).

## Why

Picking is interactive, so a hidden tab is never reused.
