# GeneralSettings

`ui/shell/settings/general/GeneralSettings.js`

The rows of General, Privacy & permissions, Editors & agents and API & MCP that have no panel of their own, and the fold groups those tabs use ([FoldGroups](FoldGroups.md), installed here): composes the parts below (three IdeInstallerList instances: JetBrains, VS Code, Windhawk), the application switches, DNS, MCP export, guides and endpoint lists; values reload on `settings:open`.

## Methods

- `install()` -> false when the markup is missing.
- `load()`.

## Globals

Reads `window.electronAPI` settings methods, `window.ipcBridge`.
