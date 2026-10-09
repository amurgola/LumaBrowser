# AddonsBrowser

`core/shell/ui/settings/AddonsBrowser.js` (ES module)

Browse Add-ons: the lumabyte.com add-on catalog with Download or Reinstall per add-on.

## Methods

- `new AddonsBrowser({ pane, hooks, onBack })`, `show()`: `core.shell.getAvailableAddons`
  (`{ ok, extensions, error }`); each row's button calls
  `core.shell.downloadAndInstallAddon(id)`, reads Installed or "Installed
  (restart to run)", and toasts; a failure restores the button.

## Globals

Reads `window.ipcBridge.invoke`.
