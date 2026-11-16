# AddressBar

`ui/shell/omnibox/AddressBar.js`

The address input: shows the active URL (not while the user edits), reverts, takes the keyboard with select-all, hands it back to the page, carries the placeholder and the popup anchor rect.

## Methods

- `el`, `isFocused()`, `showUrl(url)`, `showUrlUnlessEditing(url)`, `revert()`, `setPlaceholder(text)`, `anchorRect()`.
- `focusAndSelect()`: asks main for the keyboard (`tabAPI.focusChrome`) before focusing the input. Without that the caret moves but the keys keep going to the page, which is what a new tab, Ctrl+L, Alt+D and F6 from a page ran into.
- `handToPage()`: blurs the input and gives the page the keyboard (`tabAPI.focusPage`), as after a navigation.

## Globals

Reads `window.tabAPI.focusChrome`, `window.tabAPI.focusPage`.
