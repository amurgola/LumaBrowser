# AppInstaller

`cli/lib/launcher/AppInstaller.js`

Downloads and prepares the LumaBrowser build for this platform.

## Methods

- `new AppInstaller(out, { env?, platform?, arch? })`: `out` is a [ConsoleOutput](ConsoleOutput.md);
  the manifest URL is `$LUMABROWSER_MANIFEST_URL` or `https://lumabyte.com/install/manifest.json`.
- `install({ force = false })`: fetches the manifest (`{ version, assets: { <platformKey>: { url, filename } } }`),
  throws when it has no asset for this platform (naming the ones it has), reuses a current cached
  build unless forced, else downloads into `~/.lumabrowser` with a progress bar, prepares it and
  writes the [InstallRecord](../connect/InstallRecord.md). Resolves the record.
- `platformKey()`: `win32-x64`, `darwin-arm64`, `darwin-x64`, `linux-x64`, else `<platform>-<arch>`.
- `AppInstaller.renderBar(pct)`: `[####------...]`, 20 cells.

Preparing: Windows runs the portable exe as is; Linux marks the AppImage executable; macOS unzips with
`ditto` into `~/.lumabrowser/app`, finds the `.app` and clears its quarantine flag.

## Why

The source repository is private, so builds come from the lumabyte.com manifest rather than GitHub
Releases.
