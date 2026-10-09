# HeroCard

`ide/webview/ui/HeroCard.js`

The card in place of an empty transcript: starters when connected, a spinner while connecting, Start / Reconnect / Settings when offline.

## Methods

- `new HeroCard(container, page)`; `paint()`, `hide()`.
- `HeroCard.baseName(path)`: last path segment on either separator, or `project`. `HeroCard.STARTERS`.
