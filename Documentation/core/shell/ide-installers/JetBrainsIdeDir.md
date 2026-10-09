# JetBrainsIdeDir

`core/shell/ide-installers/JetBrainsIdeDir.js`

Knows how JetBrains names and places its per-IDE user directories.

## Methods

- `JetBrainsIdeDir.parse(name)` turns `WebStorm2026.2` into
  `{ product: 'WebStorm', version: '2026.2', label: 'WebStorm 2026.2' }`, or
  `null` for anything that is not a known product plus a `YYYY.N[.N]` version.
- `JetBrainsIdeDir.compare(a, b)` sorts parsed rows by product label, then
  newest version first.
- `JetBrainsIdeDir.vendorRoots(platform, homeDir, appData)` returns
  `[{ configRoot, pluginsRoot, pluginsSubdir }]` for the `JetBrains` and
  `Google` (Android Studio) vendors.
- `JetBrainsIdeDir.pluginsDir(root, ideDirName)` is the plugins folder for one IDE.
- `JetBrainsIdeDir.PRODUCTS` maps folder prefixes to product names.

## Layout

| Platform | Config folder | Plugins folder |
|---|---|---|
| Windows | `%APPDATA%\JetBrains\<Product><Ver>` | `...\<Product><Ver>\plugins` |
| macOS | `~/Library/Application Support/JetBrains/<Product><Ver>` | `.../<Product><Ver>/plugins` |
| Linux | `~/.config/JetBrains/<Product><Ver>` | `~/.local/share/JetBrains/<Product><Ver>` (no `plugins/`) |

Each folder appears the first time that IDE version runs.
