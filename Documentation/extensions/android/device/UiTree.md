# UiTree

`extensions/android/device/UiTree.js`

Reads what is on a device's screen from its accessibility tree (uiautomator).

## Methods

- `capture()` -> `{ elements, millis }`.
- `UiTree.parse(xml)` -> `[{ label, role, id, clickable, x, y }]`, the centre of each element in screen pixels.
- `UiTree.format(elements)`: one line per element for a model, `[x,y] role "label" (tap)`.
