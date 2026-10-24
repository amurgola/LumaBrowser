# GeneralSettings

`ui/shell/settings/general/GeneralSettings.js`

General and API & MCP settings: composes the parts below (three IdeInstallerList instances: JetBrains, VS Code, Windhawk), the application switches, DNS, MCP export, guides and endpoint lists; values reload on `settings:open`.

## Methods

- `install()` -> false when the markup is missing.
- `load()`.

## Globals

Reads `window.electronAPI` settings methods, `window.ipcBridge`.
