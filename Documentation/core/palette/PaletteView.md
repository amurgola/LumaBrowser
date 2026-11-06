# PaletteView

`core/palette/PaletteView.js`

The search palette's view in one browser window: a transparent
`WebContentsView` laid over the whole window (the page dims under its scrim, the
card floats near the top). Created on first use, then kept loaded and hidden so
later opens are instant. Its page is [palette.html](ui/palette.md) with
[palette-preload](ui/palette-preload.md).

## Methods

- `new PaletteView(win, { electron, info })`: `info()` returns `{ private }` for
  the page. Follows the window's resize while visible.
- `show()`: remembers which webContents had focus, raises the view to the top,
  sizes it to the window, focuses it and sends `palette:show` with
  `{ private, openedAt }` (held until the page has loaded on the first open).
- `hide({ restoreFocus = true })`: hides it, sends `palette:hidden` and gives focus
  back to what had it, unless an item was opened (the item decides where focus
  goes).
- `toggle()`, `raiseIfVisible()` (a tab switch re-adds the content view on top),
  `isSender(webContents)`, `send(channel, payload)`, `destroy()`.

## Why

Unlike the chrome's overlay layers the palette takes keyboard focus, so it must
hand it back on close. It also closes itself when its webContents loses focus to
another window, as a menu would.
