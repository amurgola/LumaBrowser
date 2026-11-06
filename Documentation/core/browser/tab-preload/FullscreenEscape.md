# FullscreenEscape

`core/browser/tab-preload/FullscreenEscape.js`

Esc leaves page fullscreen whatever the page does with the key, as Chrome guarantees. The tab preload listens in the
capture phase on the window, before page scripts, and calls `document.exitFullscreen()`. Main's TabFullscreen then
hears `leave-html-full-screen` and restores the window.

## Methods

- `FullscreenEscape.install(window)`.
