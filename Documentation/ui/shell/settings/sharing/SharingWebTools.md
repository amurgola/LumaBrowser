# SharingWebTools

`ui/shell/settings/sharing/SharingWebTools.js`

Chat tools web-backend clients may use (globally disabled tools excluded; all-on saves null). The list sits in the `share-tools` fold group ([FoldGroups](../general/FoldGroups.md)); its summary line counts what web clients may use.

## Methods

- `install()`, `refreshGloballyDisabled()`, `render(cfg)`, `draw()`.
- `visibleGroups(groups, disabled)`, `payload(names, allowed)` (static).

## Globals

Reads `window.electronAPI.getAvailableEndpoints`.
