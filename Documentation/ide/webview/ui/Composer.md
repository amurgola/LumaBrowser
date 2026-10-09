# Composer

`ide/webview/ui/Composer.js`

The prompt box: auto-grow (to 160px), ghost suggestion (Tab takes it), history on the arrows, Enter sends, Escape stops or clears, and the hint line.

## Methods

- `new Composer(el, page)`; `value` (get/set), `commit(text)` (history, then clear), `focus()`, `insertText(text)`,
  `grow()`, `setSuggestion(text)`, `setPlaceholder(text)`, `paintGhost()`, `paintHint()`, `flashHint(text)`.
  `suggestion` holds the current suggestion.
