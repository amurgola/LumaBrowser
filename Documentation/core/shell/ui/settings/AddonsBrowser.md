# AddonsBrowser

`core/shell/ui/settings/AddonsBrowser.js` (ES module)

The Browse Extensions subtab: the lumabyte.com add-on catalog with Download or Reinstall per add-on, rendered into its own pane (no Back button).

## Methods

- `new AddonsBrowser({ pane, hooks })`, `load()`: `core.shell.getAvailableAddons`
  (`{ ok, extensions, error }`); each row's button calls
  `core.shell.downloadAndInstallAddon(id)`, reads Installed or "Installed
  (restart to run)", and toasts; a failure restores the button.

## Globals

Reads `window.ipcBridge.invoke`.

## As cards

Each catalog entry is an [ExtCard](ExtCard.md) without a checkbox (nothing to
turn on until it is installed). `AddonsBrowser.stateOf(addon)`:

- `install`: not installed; primary `Install`.
- `update`: the catalog version is newer than `installedVersion`
  (`compareVersions`); primary `Update to vX`.
- `installed`: state word `Installed`; `Reinstall` in the tray.

The tray lists the installed version, the available version and the download
size. Every button that downloads carries `ext-addon-get-btn`.
