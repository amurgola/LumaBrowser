# FullscreenMode

`ui/shell/window/FullscreenMode.js`

Full screen in the chrome. When the window is full screen (F11), the `browser-fullscreen` body class hides the title
bar, toolbar and bookmarks bar, so the content area (and the tab view) grows to the whole screen. During page
fullscreen the chrome only closes its popups, since the page covers the window. A hint in the overlay's `fs-hint` layer
says "Press F11 to exit full screen" or "Press Esc to exit full screen" for 3 s.

## Methods

- `new FullscreenMode({ host })`, `install()`, `onWindowState(state)`, `onPageFullscreen(p)`,
  `FullscreenMode.hintHtml(text)`.
