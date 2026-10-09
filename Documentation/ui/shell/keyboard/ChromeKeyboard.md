# ChromeKeyboard

`ui/shell/keyboard/ChromeKeyboard.js`

Keyboard and wheel wiring: chrome-focused shortcuts (Escape left to the address and find bars first), main-forwarded shortcuts and the `open-settings` request from internal tabs, Ctrl+wheel and Ctrl+middle-click zoom, capture-phase popup-menu keys, the Escape fan-out for modals and Ctrl+Shift+Y.

## Methods

- `new ChromeKeyboard(deps)`.
- `installShortcuts()` (registered where the legacy tab wiring was).
- `installPopupKeys()`.

## Globals

Reads `window.tabAPI.onAccelerator`.
