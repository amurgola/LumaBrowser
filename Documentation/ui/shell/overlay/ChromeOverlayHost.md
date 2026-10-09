# ChromeOverlayHost

`ui/shell/overlay/ChromeOverlayHost.js`

The shell side of main's ChromeOverlay (a transparent native view above the page): which popup is open in the 'popup' layer, placement, and dismissal on outside clicks (with exemptions for self-toggling buttons), window blur (deferred so an overlay click's action still arrives) and resize.

## Methods

- `mode`, `show(mode, geometry)`, `hide()`, `onHide(fn)`, `addDismissExemption(fn)`, `armDismiss()`, `cancelBlurHide()`, `isMenuOpen()`, `install({ onResize })`.
- `ChromeOverlayHost.place(geometry)`.

## Globals

Reads `window.chromeOverlayAPI`.
