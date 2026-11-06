# palette-preload

`core/palette/ui/palette-preload.js`

Preload of the search palette page ([PaletteView](../PaletteView.md)). Exposes
`window.paletteAPI`, the page's only line to main; every call is answered only
for a palette view ([PaletteIpcHandlers](../PaletteIpcHandlers.md) checks the
sender). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `search(query)` | invoke `core.palette.search` |
| `open(item)` | invoke `core.palette.open` |
| `close()` | invoke `core.palette.close` |
| `dig(query)` | invoke `core.palette.dig` |
| `digAbort()` | invoke `core.palette.digAbort` |
| `continueInChat(query)` | invoke `core.palette.continueInChat` |
| `onShow(cb)` | subscribe `palette:show` (`{ private, openedAt }`) |
| `onHidden(cb)` | subscribe `palette:hidden` |
| `onDigEvent(cb)` | subscribe `core.palette.digEvent` |
