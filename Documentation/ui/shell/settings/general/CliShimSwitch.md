# CliShimSwitch

`ui/shell/settings/general/CliShimSwitch.js`

The `luma` terminal launcher switch (installed state, help line, disabled while installing).

## Methods

- `install()`, `load()`.
- `CliShimSwitch.installedMessage(r)`.

## Globals

Reads `window.ipcBridge.invoke('core.settings.cliShim.*')`.
