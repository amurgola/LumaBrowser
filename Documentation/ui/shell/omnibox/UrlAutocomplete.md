# UrlAutocomplete

`ui/shell/omnibox/UrlAutocomplete.js`

Address-bar behaviour: debounced history suggestions in the chrome overlay (a go-to row for URL-shaped text, the search fallback last), arrows/Enter/Escape, Chrome's select-all on first click, revert on blur, and navigation.

## Methods

- `install()`, `update(query)`, `commit(index)`, `setActive(index)`, `hide()`, `isOpen()`, `navigateTo(text)`, `items`, `active`.

## Globals

Reads `window.historyAPI.suggest`, `window.chromeOverlayAPI`.
