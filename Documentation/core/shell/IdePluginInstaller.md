# IdePluginInstaller

`core/shell/IdePluginInstaller.js`

Puts the bundled LumaBrowser plugin into every JetBrains IDE the user has run,
by copying it into each IDE's per-user plugins folder. Extends
[IdeInstaller](ide-installers/IdeInstaller.md); folder rules live in
[JetBrainsIdeDir](ide-installers/JetBrainsIdeDir.md).

## Methods

- `new IdePluginInstaller({ sourceDir, version?, platform?, homeDir?, appData?, fsOps? })`
  `sourceDir` is the unpacked plugin (`resources/ide/luma-jetbrains`); throws
  without it. `appData` is Windows `%APPDATA%`.
- `available()`: `sourceDir/lib` is a folder.
- `sourceVersion()`: `version` from `sourceDir/luma-plugin.json`, else the
  `jetbrains.json` sidecar beside `sourceDir`, else the app version.
- `roots()`: vendor roots to scan (see JetBrainsIdeDir).
- `detectIdes()`: rows `{ id, product, version, label, configDir, pluginsDir,
  pluginDir, installed, installedVersion, current, latest }`, sorted by product
  label then newest version, `latest` set on the newest of each product.
- `status()` adds `sourceDir` and `pluginDirName`.
- `install(ids?)`, `uninstall(ids?)`, `refreshIfInstalled()`: see the base.
  Install is a fresh copy plus a `luma-plugin.json` marker
  `{ version, appVersion, installedAt }`. Refresh recopies installs that are not
  `current`.
- Statics: `PLUGIN_DIR_NAME` (`luma-jetbrains`), `MARKER_FILE`, `SIDECAR_FILE`.

## Why

JetBrains IDEs load any plugin found in their per-user plugins folder at start,
so installing is a copy. The NSIS installer does the same copy on Windows, so the
layouts must agree; a copy without a marker (for example from the installer)
still counts as installed. The copy is fresh because leftover jars from an older
version would be loaded alongside the new ones. The marker lets boot refresh an
older copy after an app update and lets status say "restart the IDE" versus
"up to date".
