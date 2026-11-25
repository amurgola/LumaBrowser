# SharingWebTools

`ui/shell/settings/sharing/SharingWebTools.js`

Chat tools web-backend clients may use (globally disabled tools excluded). Until the host ticks anything the host's defaults show (`cfg.webDefaultTools`, the built-in chat tools); every change saves the ticked names, never null, so a tool added later stays off until it is ticked. The list sits in the `share-tools` fold group ([FoldGroups](../general/FoldGroups.md)); its summary line counts what web clients may use.

## Methods

- `install()`, `refreshGloballyDisabled()`, `render(cfg)`, `draw()`.
- `visibleGroups(groups, disabled)`, `payload(names, allowed)`, `ticked(cfg)` (static).
- `visibleToolGroups(groups)`: `visibleGroups` with the current globally disabled set, for the per-user editor ([SharingUserPermissions](SharingUserPermissions.md)).

## Globals

Reads `window.electronAPI.getAvailableEndpoints`.
