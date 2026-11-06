# Search palette page files

`core/palette/ui/palette.html`, `core/palette/ui/css/palette.css`

The page [PaletteView](../PaletteView.md) loads from `file://` into its
transparent overlay view. The HTML has a strict CSP (`default-src 'none'`, own
script and style, `data:` images only), links the LLM tab's `tokens.css` for the
shared design tokens, then `palette.css`, and loads one module,
[entry.js](js/entry.md).

Markup: a full-window scrim (`#scrim`, a click closes), the card (`#card`,
`role="dialog"`) with the search input, the "Private window" badge, the results
list (`#list`, a listbox), the Dig deeper pane (`#dig`) and a footer of key hints
(arrows move, Enter open, Tab dig deeper, Esc close or back).

## Look

`palette.css` draws a dimming scrim and one floating command surface
(`--surface-pop`, `--shadow-pop`) about a tenth of the way down the window, up to
680 px wide, fading and sliding in when `body.is-open` is set. Rows carry a kind
icon, the title with matched words as `<mark>`, a subtitle, and a tag or shortcut
keycaps on the right; the active row is highlighted.
