# ChromeOverlay layer page

`core/browser/ui/overlay/` (page: `core/browser/overlay/overlay.html`, loaded by ChromeOverlay)

A display-only layer: [OverlayView](OverlayView.md) renders what main pushes,
[OverlayInput](OverlayInput.md) reports interactions; `entry.js` wires both.
The inline `<style>` became `css/overlay-base.css`,
`overlay-notification-log.css`, `overlay-favicon.css`,
`overlay-url-suggestions.css` and `overlay-menus.css` (same rules, linked in
the original order). The page still does not load base.css (its body padding
and background would break the edge-to-edge transparent popup).

Globals: reads `window.overlayAPI`, `getSelection`, animation frames.
