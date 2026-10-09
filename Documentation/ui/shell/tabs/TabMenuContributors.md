# TabMenuContributors

`ui/shell/tabs/TabMenuContributors.js`

The registry behind `window.registerTabMenuContributor`: extensions add items to a regular tab's right-click menu. Contributors get a plain snapshot (never the DOM element) and the menu waits at most 300 ms for them.

## Methods

- `register(fn)` -> unregister.
- `collect(tab, tabId, map)` -> extra items.
- `TabMenuContributors.snapshot(tab)`.
- `size`.

## Globals

None (published by ShellGlobals).
