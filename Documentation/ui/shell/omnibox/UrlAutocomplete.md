# UrlAutocomplete

`ui/shell/omnibox/UrlAutocomplete.js`

Address-bar behaviour: debounced suggestions in the chrome overlay (a go-to row for URL-shaped text, then up to 2 open tabs, 3 bookmarks and history filling the rest of `LIMIT` (7) without repeated addresses, the search fallback last; picking a tab row switches to it), arrows/Enter/Escape, Chrome's select-all on first click, revert on blur, and navigation.

## Methods

- `install()`, `update(query)`, `commit(index)`, `setActive(index)`, `hide()`, `isOpen()`, `navigateTo(text)`, `items`, `active`.

## Globals

Reads `window.historyAPI.suggest`, `window.chromeOverlayAPI`.
