# InputDriver

`core/browser/InputDriver.js`

Sends real, trusted mouse input to a webContents through `sendInputEvent`.

## Methods

- `InputDriver.trustedClick(wc, cssX, cssY, { button, clickCount })` sends
  mouseMove, then mouseDown/mouseUp (twice for `clickCount: 2`). `button` is
  `left` (default), `right` or `middle`; anything else falls back to `left`.
- `InputDriver.toDip(wc, x, y)` converts viewport CSS px to the view-relative
  DIP `sendInputEvent` expects (CSS px times zoom factor, rounded). A missing or
  throwing zoom factor counts as 1.

## Why

The old click path fired `el.click()` in page JS: `isTrusted: false`, no
pointer sequence, no hover, no focus, no default actions, so canvas apps and
isTrusted checks ignored it. `sendInputEvent` enters Chromium's input pipeline
like hardware input, including compositor hit-testing, so OOPIF iframes and
shadow DOM resolve correctly.

The 20 ms gaps between stages let pages with pointerdown-armed handlers (menus,
ripple buttons) process each stage. A double click is two down/up pairs counted
1 then 2, 40 ms apart, because Chromium only fires `dblclick` that way.

Keyboard input is not here: key presses stay on the in-page path in TabManager,
and trusted typing lives in [KeyInput](widgets/KeyInput.md).
