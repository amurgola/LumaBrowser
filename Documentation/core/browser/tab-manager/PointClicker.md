# PointClicker

`core/browser/tab-manager/PointClicker.js`

click_at and point_info at viewport CSS pixel coordinates.

## Methods

- `PointClicker.pointInfo(page, x, y)` -> `{ success, data: { cssWidth, cssHeight, inView, target? } }`; no input.
- `PointClicker.clickAt(page, { x, y, button, clickCount })` -> `data: { x, y, button, clickCount, target, evidence? }`
  plus `urlChanged` / `newUrl`. Non-numbers and off-viewport points are refused before any input;
  `button` defaults to `left`, `clickCount` is 1 or 2.

## Why

For pages whose controls the DOM cannot name (canvas UIs, div soup). The hit test doubles as the before-snapshot, so the click costs no extra round trip, and the reply says what was under the point.
