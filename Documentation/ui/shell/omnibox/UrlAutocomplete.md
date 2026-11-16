# UrlAutocomplete

`ui/shell/omnibox/UrlAutocomplete.js`

Address-bar behaviour: debounced suggestions in the chrome overlay (a go-to row for URL-shaped text, then up to 2 open tabs, 3 bookmarks and history filling the rest of `LIMIT` (7) without repeated addresses, the search fallback last; picking a tab row switches to it), arrows/Enter/Escape, Chrome's select-all on first click, revert on blur, and navigation.

Enter, a picked suggestion and a second Escape hand the keyboard to the page ([AddressBar](AddressBar.md) `handToPage`).

A blur only counts once it has lasted `BLUR_HIDE_MS` (150): when the whole chrome loses the keyboard the input stays the active element, and the loss can last an instant (a new tab's first page takes the keyboard and main hands it back), so typed text, the caret and the open suggestions survive it. Focus moving on inside the chrome still reverts typed text at once.

## Methods

- `install()`, `update(query)`, `commit(index)`, `setActive(index)`, `hide()`, `isOpen()`, `navigateTo(text)`, `items`, `active`.

## Globals

Reads `window.historyAPI.suggest`, `window.chromeOverlayAPI`.
