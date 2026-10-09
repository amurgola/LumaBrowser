# SharingWebTools

`ui/shell/settings/sharing/SharingWebTools.js`

Chat tools web-backend clients may use (globally disabled tools excluded; all-on saves null).

## Methods

- `install()`, `refreshGloballyDisabled()`, `render(cfg)`, `draw()`.
- `visibleGroups(groups, disabled)`, `payload(names, allowed)` (static).

## Globals

Reads `window.electronAPI.getAvailableEndpoints`.
